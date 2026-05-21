from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.dependencies import get_db
from app.models.memory import Memory
from app.core.exceptions import NotFoundError
from sqlalchemy import select, delete

router = APIRouter(prefix="/memory", tags=["memory"])


@router.get("/{flow_id}")
async def get_memory(
    flow_id: str,
    session_id: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Memory).where(Memory.flow_id == flow_id)
    if session_id is not None:
        stmt = stmt.where(Memory.session_id == session_id)
    result = await db.execute(stmt)
    records = result.scalars().all()
    if not records:
        raise NotFoundError(f"No memory found for flow '{flow_id}'.")
    return [{"id": str(m.id), "session_id": m.session_id, "entries": m.entries} for m in records]


class MemoryEntry(BaseModel):
    role: str
    content: str


@router.post("/{flow_id}", status_code=status.HTTP_201_CREATED)
async def create_or_append_memory(
    flow_id: str,
    entry: MemoryEntry,
    session_id: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    import datetime

    stmt = select(Memory).where(
        Memory.flow_id == flow_id,
        Memory.session_id == session_id,
    )
    result = await db.execute(stmt)
    memory: Memory | None = result.scalar_one_or_none()

    if memory is None:
        memory = Memory(flow_id=flow_id, session_id=session_id, entries=[])
        db.add(memory)

    entries = list(memory.entries or [])
    entries.append({
        "role": entry.role,
        "content": entry.content,
        "timestamp": datetime.datetime.utcnow().isoformat(),
    })
    memory.entries = entries
    await db.commit()
    return {"id": str(memory.id), "session_id": memory.session_id, "entries": memory.entries}


@router.delete("/{flow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def clear_memory(
    flow_id: str,
    session_id: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = delete(Memory).where(Memory.flow_id == flow_id)
    if session_id is not None:
        stmt = stmt.where(Memory.session_id == session_id)
    await db.execute(stmt)
    await db.commit()
