from typing import Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.engine.executors.base import BaseExecutor
from app.models.memory import Memory


class MemoryExecutor(BaseExecutor):
    """
    Reads and/or writes conversation memory for the current flow + session.
    Config:
        operation: "read" | "write" | "read_write"
        max_entries: int  (default 20)
    Inputs:
        message:  str  – new user message to append (for write)
        response: str  – assistant response to append (for write)
    Outputs:
        history: list[dict]  – list of {role, content, timestamp} entries
    """

    async def execute(
        self,
        node: dict,
        inputs: dict[str, Any],
        context: dict[str, Any],
    ) -> dict[str, Any]:
        import datetime

        config: dict = (node.get("data") or {}).get("config") or {}
        operation: str = config.get("operation", "read_write")
        max_entries: int = int(config.get("max_entries", 20))

        flow_id: str = context["flow_id"]
        session_id: str | None = context.get("session_id")
        db: AsyncSession = context["db"]

        # Load or create memory record
        stmt = select(Memory).where(
            Memory.flow_id == flow_id,
            Memory.session_id == session_id,
        )
        result = await db.execute(stmt)
        memory: Memory | None = result.scalar_one_or_none()

        if memory is None:
            memory = Memory(
                flow_id=flow_id,
                session_id=session_id,
                entries=[],
            )
            db.add(memory)

        entries: list[dict] = list(memory.entries or [])

        # READ PHASE
        if operation in ("read", "read_write"):
            history = entries[-max_entries:] if max_entries else entries
        else:
            history = []

        # WRITE PHASE
        if operation in ("write", "read_write"):
            now = datetime.datetime.utcnow().isoformat()

            user_msg = (
                inputs.get("message")
                or inputs.get("prompt")
                or inputs.get("input")
            )
            assistant_msg = (
                inputs.get("response")
                or inputs.get("answer")
                or inputs.get("result")
            )

            if user_msg:
                entries.append({"role": "user", "content": user_msg, "timestamp": now})
            if assistant_msg:
                entries.append(
                    {"role": "assistant", "content": assistant_msg, "timestamp": now}
                )

            # Trim to max_entries
            if max_entries and len(entries) > max_entries:
                entries = entries[-max_entries:]

            memory.entries = entries
            await db.flush()

        return {"history": history}
