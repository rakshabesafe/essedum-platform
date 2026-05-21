"""
Flow execution runner.

Responsibilities:
  - Validate all nodes are V1-supported
  - Create + update Execution records
  - Topologically sort nodes and execute them in order
  - Broadcast real-time events over WebSocket (via Redis pub/sub)
  - Persist per-node ExecutionLog records
  - Expose ConnectionManager for WS clients
"""

import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import WebSocket
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.engine.executors import get_executor
from app.engine.graph import get_node_by_id, resolve_inputs, topological_sort
from app.models.execution import Execution, ExecutionLog, ExecutionStatus, LogLevel

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# WebSocket connection manager
# ---------------------------------------------------------------------------

class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[str, list[WebSocket]] = {}

    async def connect(self, execution_id: str, ws: WebSocket) -> None:
        await ws.accept()
        self._connections.setdefault(execution_id, []).append(ws)

    def disconnect(self, execution_id: str, ws: WebSocket) -> None:
        connections = self._connections.get(execution_id, [])
        if ws in connections:
            connections.remove(ws)

    async def broadcast(self, execution_id: str, message: dict) -> None:
        payload = json.dumps(message)
        for ws in list(self._connections.get(execution_id, [])):
            try:
                await ws.send_text(payload)
            except Exception:
                pass


manager = ConnectionManager()


# ---------------------------------------------------------------------------
# Redis channel helpers
# ---------------------------------------------------------------------------

def _channel(execution_id: str) -> str:
    return f"execution:{execution_id}"


async def _publish(redis: Redis, execution_id: str, event: dict) -> None:
    try:
        await redis.publish(_channel(execution_id), json.dumps(event))
    except Exception as exc:
        logger.warning("Redis publish failed for %s: %s", execution_id, exc)


# ---------------------------------------------------------------------------
# Core runner
# ---------------------------------------------------------------------------

async def run_flow(
    *,
    flow_id: str,
    input_data: dict[str, Any],
    db: AsyncSession,
    redis: Redis,
) -> str:
    """
    Create an Execution record and kick off the flow synchronously.
    Returns the execution_id.

    Intended to be called inside a FastAPI BackgroundTask.
    """
    from sqlalchemy import select
    from app.models.flow import Flow

    # ── Load flow ──────────────────────────────────────────────────────────
    row = await db.get(Flow, flow_id)
    if row is None:
        raise ValueError(f"Flow '{flow_id}' not found.")

    nodes: list[dict] = row.nodes or []
    edges: list[dict] = row.edges or []

    # ── Validate V1 node types ─────────────────────────────────────────────
    for node in nodes:
        get_executor(node["type"])  # raises for unsupported types

    # ── Create Execution record ────────────────────────────────────────────
    execution = Execution(
        id=str(uuid.uuid4()),
        flow_id=flow_id,
        status=ExecutionStatus.running,
        started_at=datetime.now(timezone.utc),
        input=input_data,
    )
    db.add(execution)
    await db.flush()
    execution_id = execution.id

    # ── Build execution context ────────────────────────────────────────────
    session_id: str | None = input_data.get("session_id")
    ctx: dict[str, Any] = {
        "flow_id": flow_id,
        "execution_id": execution_id,
        "session_id": session_id,
        "input": input_data,
        "db": db,
        "redis": redis,
    }
    node_outputs: dict[str, Any] = {}

    await _publish(redis, execution_id, {
        "event": "execution_started",
        "execution_id": execution_id,
    })

    # ── Topological execution ──────────────────────────────────────────────
    try:
        order = topological_sort(nodes, edges)
    except ValueError as exc:
        await _fail_execution(execution, db, redis, str(exc))
        return execution_id

    final_output: dict = {}

    for node_id in order:
        try:
            node = get_node_by_id(nodes, node_id)
        except KeyError:
            continue

        node_type = node.get("type", "")

        await _publish(redis, execution_id, {
            "event": "node_started",
            "execution_id": execution_id,
            "node_id": node_id,
            "node_type": node_type,
        })

        try:
            inputs = resolve_inputs(node_id, edges, node_outputs)
            executor = get_executor(node_type)
            output = await executor.execute(node, inputs, ctx)
            node_outputs[node_id] = output

            # Track final output from chat_output nodes
            if node_type == "chat_output":
                final_output = output

            await _log(db, execution_id, node_id, LogLevel.success,
                       f"Node '{node_id}' completed successfully.")
            await _publish(redis, execution_id, {
                "event": "node_completed",
                "execution_id": execution_id,
                "node_id": node_id,
                "node_type": node_type,
                "output": output,
            })

        except Exception as exc:
            logger.exception("Node %s failed: %s", node_id, exc)
            await _log(db, execution_id, node_id, LogLevel.error,
                       f"Node '{node_id}' failed.", {"error": str(exc)})
            await _publish(redis, execution_id, {
                "event": "node_error",
                "execution_id": execution_id,
                "node_id": node_id,
                "error": str(exc),
            })
            await _fail_execution(execution, db, redis, str(exc))
            return execution_id

    # ── Mark completed ─────────────────────────────────────────────────────
    execution.status = ExecutionStatus.completed
    execution.completed_at = datetime.now(timezone.utc)
    execution.output = final_output
    await db.commit()

    await _publish(redis, execution_id, {
        "event": "execution_completed",
        "execution_id": execution_id,
        "output": final_output,
    })

    return execution_id


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _log(
    db: AsyncSession,
    execution_id: str,
    node_id: str,
    level: LogLevel,
    message: str,
    detail: dict | None = None,
) -> None:
    log = ExecutionLog(
        id=str(uuid.uuid4()),
        execution_id=execution_id,
        node_id=node_id,
        level=level,
        message=message,
        detail=detail or {},
        timestamp=datetime.now(timezone.utc),
    )
    db.add(log)
    await db.flush()


async def _fail_execution(
    execution: Execution,
    db: AsyncSession,
    redis: Redis,
    error: str,
) -> None:
    execution.status = ExecutionStatus.error
    execution.completed_at = datetime.now(timezone.utc)
    execution.error = error
    await db.commit()
    await _publish(redis, execution.id, {
        "event": "execution_error",
        "execution_id": execution.id,
        "error": error,
    })
