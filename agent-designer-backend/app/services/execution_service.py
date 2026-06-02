import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.execution import Execution, ExecutionLog, ExecutionStatus
from app.core.exceptions import NotFoundError


async def get_execution(db: AsyncSession, execution_id: str) -> Execution:
    execution = await db.get(Execution, execution_id)
    if execution is None:
        raise NotFoundError(f"Execution '{execution_id}' not found.")
    return execution


async def list_executions(
    db: AsyncSession, flow_id: str | None = None, skip: int = 0, limit: int = 50
) -> list[Execution]:
    stmt = select(Execution).offset(skip).limit(limit)
    if flow_id:
        stmt = stmt.where(Execution.flow_id == flow_id)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_execution_logs(
    db: AsyncSession, execution_id: str, skip: int = 0, limit: int = 200
) -> list[ExecutionLog]:
    stmt = (
        select(ExecutionLog)
        .where(ExecutionLog.execution_id == execution_id)
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def stop_execution(db: AsyncSession, execution_id: str) -> Execution:
    execution = await get_execution(db, execution_id)
    if execution.status == ExecutionStatus.running:
        execution.status = ExecutionStatus.stopped
        await db.commit()
        await db.refresh(execution)
    return execution
