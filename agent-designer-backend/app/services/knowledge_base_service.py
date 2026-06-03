import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.knowledge_base import KnowledgeBase
from app.schemas.knowledge_base import KnowledgeBaseCreate, KnowledgeBaseUpdate
from app.core.exceptions import NotFoundError
from app.vectordb.factory import get_provider


async def list_knowledge_bases(
    db: AsyncSession, skip: int = 0, limit: int = 50
) -> list[KnowledgeBase]:
    result = await db.execute(select(KnowledgeBase).offset(skip).limit(limit))
    return list(result.scalars().all())


async def get_knowledge_base(db: AsyncSession, kb_id: str) -> KnowledgeBase:
    kb = await db.get(KnowledgeBase, kb_id)
    if kb is None:
        raise NotFoundError(f"Knowledge base '{kb_id}' not found.")
    return kb


async def create_knowledge_base(
    db: AsyncSession, data: KnowledgeBaseCreate
) -> KnowledgeBase:
    kb_id = str(uuid.uuid4())
    collection_name = f"kb_{kb_id.replace('-', '_')}"

    kb = KnowledgeBase(
        id=kb_id,
        name=data.name,
        description=data.description,
        embedding_model=data.embedding_model,
        embedding_dims=data.embedding_dims,
        chunk_size=data.chunk_size,
        chunk_overlap=data.chunk_overlap,
        vectordb_provider=data.vectordb_provider,
        vectordb_config=data.vectordb_config,
        collection_name=collection_name,
        doc_count=0,
    )
    db.add(kb)
    await db.flush()

    # Create Qdrant collection (best-effort — skip if Qdrant unavailable)
    try:
        vdb = get_provider(kb.vectordb_provider, kb.vectordb_config or {})
        await vdb.create_collection(
            collection_name=collection_name,
            dimensions=kb.embedding_dims,
        )
    except Exception:
        pass  # Qdrant not available; collection will be created on first use

    await db.commit()
    await db.refresh(kb)
    return kb


async def update_knowledge_base(
    db: AsyncSession, kb_id: str, data: KnowledgeBaseUpdate
) -> KnowledgeBase:
    kb = await get_knowledge_base(db, kb_id)
    patch = data.model_dump(exclude_unset=True)
    for key, value in patch.items():
        setattr(kb, key, value)
    await db.commit()
    await db.refresh(kb)
    return kb


async def delete_knowledge_base(db: AsyncSession, kb_id: str) -> None:
    kb = await get_knowledge_base(db, kb_id)

    # Delete Qdrant collection
    try:
        vdb = get_provider(kb.vectordb_provider, kb.vectordb_config or {})
        await vdb.delete_collection(collection_name=kb.collection_name)
    except Exception:
        pass  # best-effort; don't block deletion

    await db.delete(kb)
    await db.commit()
