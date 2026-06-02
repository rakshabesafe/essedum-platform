import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, JSON, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class KnowledgeBase(Base):
    __tablename__ = "knowledge_bases"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Embedding configuration
    embedding_model: Mapped[str] = mapped_column(
        String(255), nullable=False, default="azure_openai:text-embedding-3-small"
    )
    embedding_dims: Mapped[int] = mapped_column(Integer, nullable=False, default=1536)

    # Chunking configuration
    chunk_size: Mapped[int] = mapped_column(Integer, nullable=False, default=512)
    chunk_overlap: Mapped[int] = mapped_column(Integer, nullable=False, default=50)

    # Vector store (V1: always qdrant)
    vectordb_provider: Mapped[str] = mapped_column(
        String(64), nullable=False, default="qdrant"
    )
    vectordb_config: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    collection_name: Mapped[str] = mapped_column(String(255), nullable=False)

    doc_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )
