from typing import Any
from app.engine.executors.base import BaseExecutor


class RAGExecutor(BaseExecutor):
    """
    Retrieves relevant document chunks from Qdrant, builds a context-enriched
    prompt, and calls the configured LLM to answer the query.
    """

    async def execute(
        self,
        node: dict,
        inputs: dict[str, Any],
        context: dict[str, Any],
    ) -> dict[str, Any]:
        from sqlalchemy.ext.asyncio import AsyncSession
        from app.rag.retriever import retrieve
        from app.rag.context_builder import build_context
        from app.engine.connectors import get_connector

        config: dict = (node.get("data") or {}).get("config") or {}
        kb_id: str = config["knowledge_base_id"]
        top_k: int = int(config.get("top_k", 5))
        score_threshold: float = float(config.get("score_threshold", 0.0))
        provider: str = config.get("provider", "azure_openai")
        model: str = config.get("model", "gpt-4o")
        system_prompt: str = config.get(
            "system_prompt",
            "You are a helpful assistant. Answer using only the provided context.",
        )

        query: str = (
            inputs.get("query")
            or inputs.get("message")
            or inputs.get("prompt")
            or inputs.get("input")
            or ""
        )

        db: AsyncSession = context["db"]

        chunks = await retrieve(
            kb_id=kb_id,
            query=query,
            top_k=top_k,
            score_threshold=score_threshold,
            provider=provider,
            db=db,
        )
        prompt_text = build_context(query=query, chunks=chunks)

        connector = get_connector(provider)
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt_text},
        ]
        answer = await connector.chat(model=model, messages=messages)

        return {
            "answer": answer,
            "sources": [c.get("payload", {}) for c in chunks],
        }
