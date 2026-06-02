"""
Embedding helper — delegates to the appropriate model connector.
"""

from app.engine.connectors import get_connector


async def embed_texts(
    texts: list[str],
    provider: str = "azure_openai",
    model: str = "text-embedding-3-small",
) -> list[list[float]]:
    """
    Embed a list of texts using the specified provider.
    Returns a list of float vectors (one per text).
    """
    connector = get_connector(provider)
    return await connector.embed(texts=texts, model=model)
