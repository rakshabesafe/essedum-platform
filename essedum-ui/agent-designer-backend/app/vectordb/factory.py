from app.vectordb.base import VectorStoreProvider

# V1: only Qdrant is enabled. Other providers are registered behind a feature
# gate for post-V1 releases.
_V1_PROVIDERS = {"qdrant"}


def get_provider(name: str, config: dict) -> VectorStoreProvider:
    if name not in _V1_PROVIDERS:
        raise ValueError(
            f"Vector store provider '{name}' is not enabled in V1. "
            f"Supported: {sorted(_V1_PROVIDERS)}"
        )
    if name == "qdrant":
        try:
            from app.vectordb.providers.qdrant import QdrantProvider
        except ImportError:
            raise RuntimeError(
                "qdrant-client is not installed. "
                "Install it with: pip install qdrant-client"
            )
        return QdrantProvider(config)
    raise ValueError(f"Unknown provider: {name}")
