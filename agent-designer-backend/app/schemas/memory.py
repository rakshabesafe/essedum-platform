import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class MemoryEntry(BaseModel):
    role: str  # "user" | "assistant"
    content: str
    timestamp: str | None = None


class MemoryResponse(BaseModel):
    flow_id: uuid.UUID
    session_id: str | None
    entries: list[MemoryEntry]
    updated_at: datetime

    model_config = {"from_attributes": True}


class MemoryAppendRequest(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str
    session_id: str | None = None
