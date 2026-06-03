"""
Retrieval: embed a query and search Qdrant for the nearest chunks.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.knowledge_base import KnowledgeBase
from app.rag.embedder import embed_texts
from app.vectordb.factory import get_provider


async def retrieve(
    *,
    kb_id: str,
    query: str,
    top_k: int = 5,
    score_threshold: float = 0.0,
    provider: str = "azure_openai",
    db: AsyncSession,
) -> list[dict]:
    """
    Embed ``query``, search the knowledge base's Qdrant collection, and
    return a list of payload dicts (sorted by descending score).
    """
    # Load KB to get collection name + embedding config
    kb: KnowledgeBase | None = await db.get(KnowledgeBase, kb_id)
    if kb is None:
        raise ValueError(f"Knowledge base '{kb_id}' not found.")

    collection_name: str = kb.collection_name
    embedding_model: str = kb.embedding_model.split(":", 1)[-1]  # strip "provider:" prefix

    vectors = await embed_texts(
        texts=[query],
        provider=provider,
        model=embedding_model,
    )
    query_vector = vectors[0]

    vdb = get_provider(kb.vectordb_provider, kb.vectordb_config or {})
    results = await vdb.search(
        collection_name=collection_name,
        query_vector=query_vector,
        top_k=top_k,
        score_threshold=score_threshold,
    )

    return [
        {"id": r.id, "score": r.score, "payload": r.payload}
        for r in results
    ]
