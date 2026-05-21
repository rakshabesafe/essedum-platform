from typing import List
from fastapi import APIRouter, BackgroundTasks, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis

from app.dependencies import get_db, get_redis
from app.schemas.execution import ExecutionResponse, ExecutionLogResponse, ExecutionRunRequest as RunRequest
from app.services.execution_service import (
    get_execution, list_executions, get_execution_logs, stop_execution,
)
from app.engine.runner import run_flow

router = APIRouter(prefix="/executions", tags=["executions"])


@router.post("/flows/{flow_id}/run", status_code=status.HTTP_202_ACCEPTED)
async def run_flow_endpoint(
    flow_id: str,
    request: RunRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    # Kick off in background; returns execution_id immediately
    import uuid
    from datetime import datetime, timezone
    from app.models.execution import Execution, ExecutionStatus

    execution = Execution(
        id=str(uuid.uuid4()),
        flow_id=flow_id,
        status=ExecutionStatus.pending,
        input=request.model_dump(),
    )
    db.add(execution)
    await db.commit()

    background_tasks.add_task(
        run_flow,
        flow_id=flow_id,
        input_data=request.model_dump(),
        db=db,
        redis=redis,
    )
    return {"execution_id": execution.id, "status": "pending"}


@router.get("", response_model=List[ExecutionResponse])
async def list_executions_endpoint(
    flow_id: str | None = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    return await list_executions(db, flow_id=flow_id, skip=skip, limit=limit)


@router.get("/{execution_id}", response_model=ExecutionResponse)
async def get_execution_endpoint(
    execution_id: str,
    db: AsyncSession = Depends(get_db),
):
    return await get_execution(db, execution_id)


@router.get("/{execution_id}/logs", response_model=List[ExecutionLogResponse])
async def get_logs_endpoint(
    execution_id: str,
    skip: int = 0,
    limit: int = 200,
    db: AsyncSession = Depends(get_db),
):
    return await get_execution_logs(db, execution_id, skip=skip, limit=limit)


@router.post("/{execution_id}/stop", response_model=ExecutionResponse)
async def stop_execution_endpoint(
    execution_id: str,
    db: AsyncSession = Depends(get_db),
):
    return await stop_execution(db, execution_id)
