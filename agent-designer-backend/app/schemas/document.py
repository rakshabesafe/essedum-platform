import uuid
from datetime import datetime
from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: uuid.UUID
    kb_id: uuid.UUID
    filename: str
    file_type: str
    file_size: int
    status: str
    page_count: int | None
    chunk_count: int | None
    error_message: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentListResponse(BaseModel):
    items: list[DocumentResponse]
    total: int
