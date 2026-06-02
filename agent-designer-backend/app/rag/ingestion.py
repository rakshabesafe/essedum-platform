"""
End-to-end document ingestion pipeline:
  parse → chunk → embed → upsert into Qdrant → update DB records
"""

import uuid
import logging
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.knowledge_base import KnowledgeBase
from app.models.document import Document, DocumentStatus
from app.models.document_chunk import DocumentChunk
from app.rag.parser import parse_document
from app.rag.chunker import chunk_text
from app.rag.embedder import embed_texts
from app.vectordb.factory import get_provider
from app.vectordb.base import VectorPoint

logger = logging.getLogger(__name__)

_EMBED_BATCH = 32  # embed this many chunks per API call


async def ingest_document(
    *,
    document_id: str,
    filename: str,
    content: bytes,
    db: AsyncSession,
) -> None:
    """
    Full ingestion pipeline for a single document.
    Updates the Document record's status throughout.
    """
    doc: Document | None = await db.get(Document, document_id)
    if doc is None:
        raise ValueError(f"Document '{document_id}' not found.")

    kb: KnowledgeBase | None = await db.get(KnowledgeBase, doc.kb_id)
    if kb is None:
        raise ValueError(f"Knowledge base '{doc.kb_id}' not found.")

    # ── Update status → processing ─────────────────────────────────────────
    doc.status = DocumentStatus.processing
    await db.flush()

    try:
        # 1. Parse
        text = parse_document(filename, content)

        # 2. Chunk
        chunks = chunk_text(
            text,
            chunk_size=kb.chunk_size,
            chunk_overlap=kb.chunk_overlap,
        )

        # 3. Embed (in batches)
        provider_str = kb.embedding_model.split(":", 1)[0]  # e.g. "azure_openai"
        model_str = kb.embedding_model.split(":", 1)[-1]    # e.g. "text-embedding-3-small"

        all_texts = [c.content for c in chunks]
        all_vectors: list[list[float]] = []

        for i in range(0, len(all_texts), _EMBED_BATCH):
            batch = all_texts[i : i + _EMBED_BATCH]
            vecs = await embed_texts(texts=batch, provider=provider_str, model=model_str)
            all_vectors.extend(vecs)

        # 4. Upsert into Qdrant
        vdb = get_provider(kb.vectordb_provider, kb.vectordb_config or {})
        points: list[VectorPoint] = []

        for chunk, vector in zip(chunks, all_vectors):
            point_id = str(uuid.uuid4())
            payload = {
                "document_id": document_id,
                "kb_id": str(kb.id),
                "filename": filename,
                "content": chunk.content,
                "chunk_index": chunk.chunk_index,
            }
            points.append(VectorPoint(id=point_id, vector=vector, payload=payload))

        await vdb.upsert(collection_name=kb.collection_name, points=points)

        # 5. Persist DocumentChunk rows
        for chunk, point in zip(chunks, points):
            db.add(
                DocumentChunk(
                    id=str(uuid.uuid4()),
                    document_id=document_id,
                    chunk_index=chunk.chunk_index,
                    content=chunk.content,
                    token_count=None,
                    vector_point_id=point.id,
                )
            )

        # Update document record
        doc.status = DocumentStatus.ready
        doc.chunk_count = len(chunks)
        await db.commit()

        logger.info(
            "Ingested document '%s' → %d chunks into KB '%s'.",
            filename,
            len(chunks),
            kb.name,
        )

    except Exception as exc:
        logger.exception("Ingestion failed for document '%s': %s", document_id, exc)
        doc.status = DocumentStatus.error
        doc.error_message = str(exc)
        await db.commit()
        raise
