import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document, DocumentStatus
from app.models.document_chunk import DocumentChunk
from app.models.knowledge_base import KnowledgeBase
from app.core.exceptions import NotFoundError
from app.vectordb.factory import get_provider


async def create_document(
    *,
    db: AsyncSession,
    kb_id: str,
    filename: str,
    file_type: str,
    file_size: int,
) -> Document:
    doc = Document(
        id=str(uuid.uuid4()),
        kb_id=kb_id,
        filename=filename,
        file_type=file_type,
        file_size=file_size,
        status=DocumentStatus.pending,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return doc


async def get_document(db: AsyncSession, document_id: str) -> Document:
    doc = await db.get(Document, document_id)
    if doc is None:
        raise NotFoundError(f"Document '{document_id}' not found.")
    return doc


async def list_documents(
    db: AsyncSession, kb_id: str, skip: int = 0, limit: int = 50
) -> list[Document]:
    result = await db.execute(
        select(Document)
        .where(Document.kb_id == kb_id)
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def delete_document(db: AsyncSession, document_id: str) -> None:
    doc = await get_document(db, document_id)
    kb: KnowledgeBase | None = await db.get(KnowledgeBase, doc.kb_id)

    # Remove vector points from Qdrant
    if kb is not None:
        chunks_result = await db.execute(
            select(DocumentChunk).where(DocumentChunk.document_id == document_id)
        )
        chunks = list(chunks_result.scalars().all())
        point_ids = [c.vector_point_id for c in chunks if c.vector_point_id]

        if point_ids:
            try:
                vdb = get_provider(kb.vectordb_provider, kb.vectordb_config or {})
                await vdb.delete_points(
                    collection_name=kb.collection_name, point_ids=point_ids
                )
            except Exception:
                pass  # best-effort

    await db.delete(doc)
    await db.commit()
