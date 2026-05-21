from sqlalchemy.ext.asyncio import AsyncSession

from app.rag.retriever import retrieve
from app.rag.context_builder import build_context
from app.engine.connectors import get_connector
from app.schemas.rag import RAGQueryRequest, RAGQueryResponse, SourceChunk


async def query_rag(
    db: AsyncSession,
    request: RAGQueryRequest,
) -> RAGQueryResponse:
    # Retrieve from every listed KB and merge
    all_chunks: list[dict] = []
    for kb_id in request.knowledge_base_ids:
        chunks = await retrieve(
            kb_id=kb_id,
            query=request.query,
            top_k=request.top_k,
            score_threshold=request.score_threshold,
            provider=request.llm_provider,
            db=db,
        )
        all_chunks.extend(chunks)

    # Sort by score desc and take top_k overall
    all_chunks.sort(key=lambda c: c["score"], reverse=True)
    all_chunks = all_chunks[: request.top_k]

    prompt_text = build_context(query=request.query, chunks=all_chunks)
    system_prompt = (
        request.system_prompt
        or "You are a helpful assistant. Answer using only the provided context."
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": prompt_text},
    ]

    connector = get_connector(request.llm_provider)
    answer = await connector.chat(
        model=request.llm_model,
        messages=messages,
    )

    sources: list[SourceChunk] = []
    if request.include_sources:
        for chunk in all_chunks:
            p = chunk.get("payload", {})
            sources.append(
                SourceChunk(
                    document_id=p.get("document_id", ""),
                    filename=p.get("filename", ""),
                    chunk_index=p.get("chunk_index", 0),
                    content=p.get("content", ""),
                    score=chunk["score"],
                )
            )

    return RAGQueryResponse(
        answer=answer,
        sources=sources,
        metadata={"chunks_retrieved": len(all_chunks)},
    )
