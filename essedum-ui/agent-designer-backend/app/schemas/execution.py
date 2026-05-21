import uuid
from datetime import datetime
from typing import Any
from pydantic import BaseModel


class ExecutionRunRequest(BaseModel):
    message: str
    session_id: str | None = None
    variables: dict[str, Any] | None = None


class ExecutionResponse(BaseModel):
    id: uuid.UUID
    flow_id: uuid.UUID
    status: str
    started_at: datetime | None
    completed_at: datetime | None
    input: dict[str, Any] | None
    output: dict[str, Any] | None
    error: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ExecutionLogResponse(BaseModel):
    id: uuid.UUID
    execution_id: uuid.UUID
    node_id: str | None
    level: str
    message: str
    detail: dict[str, Any] | None
    timestamp: datetime

    model_config = {"from_attributes": True}


class ExecutionLogsResponse(BaseModel):
    items: list[ExecutionLogResponse]
    total: int
