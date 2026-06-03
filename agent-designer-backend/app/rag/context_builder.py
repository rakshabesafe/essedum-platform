"""
Assembles a prompt string from retrieved document chunks + original query.
"""


def build_context(
    query: str,
    chunks: list[dict],
    max_chars: int = 8000,
) -> str:
    """
    Build a context-enriched prompt for the LLM.

    Each chunk dict is expected to have a ``payload`` key with at least
    ``content`` (the chunk text).
    """
    context_parts: list[str] = []
    total = 0

    for i, chunk in enumerate(chunks, start=1):
        payload = chunk.get("payload", {})
        text = payload.get("content", "")
        source = payload.get("filename", "")
        page = payload.get("page", "")

        header = f"[Source {i}"
        if source:
            header += f": {source}"
        if page:
            header += f", p.{page}"
        header += "]"

        part = f"{header}\n{text}"
        if total + len(part) > max_chars:
            break
        context_parts.append(part)
        total += len(part)

    context_block = "\n\n".join(context_parts)
    return (
        f"Context information:\n\n{context_block}\n\n"
        f"Question: {query}\n\n"
        "Answer based only on the context above."
    )
