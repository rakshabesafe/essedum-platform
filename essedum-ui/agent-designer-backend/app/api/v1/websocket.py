import asyncio
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from redis.asyncio import Redis

from app.dependencies import get_redis
from app.engine.runner import manager

logger = logging.getLogger(__name__)

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/executions/{execution_id}")
async def execution_ws(execution_id: str, websocket: WebSocket):
    """
    WebSocket endpoint for real-time execution events.
    Also subscribes to the Redis pub/sub channel so events are delivered
    even if the execution runs in a different worker process.
    """
    from app.dependencies import get_redis as _get_redis

    await manager.connect(execution_id, websocket)

    # Also subscribe to Redis channel for cross-process delivery
    redis: Redis = await anext(aiter(_get_redis()))
    pubsub = redis.pubsub()
    channel = f"execution:{execution_id}"
    await pubsub.subscribe(channel)

    async def _redis_listener():
        async for message in pubsub.listen():
            if message["type"] == "message":
                data = message.get("data", b"")
                if isinstance(data, bytes):
                    data = data.decode()
                try:
                    await websocket.send_text(data)
                except Exception:
                    return

    listener_task = asyncio.create_task(_redis_listener())

    try:
        while True:
            await websocket.receive_text()  # keep connection alive
    except WebSocketDisconnect:
        pass
    finally:
        listener_task.cancel()
        await pubsub.unsubscribe(channel)
        manager.disconnect(execution_id, websocket)


# Helpers for async generator protocol
def aiter(obj):
    return obj.__aiter__()


async def anext(obj):
    return await obj.__anext__()
