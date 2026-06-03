import asyncio
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.engine.runner import manager

logger = logging.getLogger(__name__)

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/executions/{execution_id}")
async def execution_ws(execution_id: str, websocket: WebSocket):
    """
    WebSocket endpoint for real-time execution events.
    Uses an in-process asyncio.Queue per connection — no Redis required.
    Events are pushed by the execution runner via manager.broadcast().
    """
    queue: asyncio.Queue = await manager.connect(execution_id, websocket)

    async def _sender():
        while True:
            message = await queue.get()
            if message is None:  # sentinel: connection closed
                return
            try:
                await websocket.send_text(message)
            except Exception:
                return

    sender_task = asyncio.create_task(_sender())

    try:
        while True:
            await websocket.receive_text()  # keep connection alive
    except WebSocketDisconnect:
        pass
    finally:
        sender_task.cancel()
        manager.disconnect(execution_id, websocket, queue)
