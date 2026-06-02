import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class KnowledgeBaseCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    embedding_model: str = "azure_openai:text-embedding-3-small"
    chunk_size: int = Field(default=512, ge=64, le=4096)
    chunk_overlap: int = Field(default=50, ge=0, le=512)
    # vectordb_config: optional Qdrant-specific overrides
    vectordb_config: dict = Field(default_factory=dict)


class KnowledgeBaseUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None


class KnowledgeBaseResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    embedding_model: str
    embedding_dims: int
    chunk_size: int
    chunk_overlap: int
    vectordb_provider: str
    collection_name: str
    doc_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class KnowledgeBaseListResponse(BaseModel):
    items: list[KnowledgeBaseResponse]
    total: int
