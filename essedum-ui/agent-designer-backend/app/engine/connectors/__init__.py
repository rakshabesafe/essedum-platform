from typing import Any

_SUPPORTED = {"azure_openai", "bedrock", "vertex_ai"}
_INSTANCES: dict[str, Any] = {}


def get_connector(provider: str):
    if provider not in _SUPPORTED:
        raise ValueError(
            f"Model provider '{provider}' is not supported in V1. "
            f"Supported: {sorted(_SUPPORTED)}"
        )
    if provider not in _INSTANCES:
        if provider == "azure_openai":
            from app.engine.connectors.azure_openai import AzureOpenAIConnector
            _INSTANCES[provider] = AzureOpenAIConnector()
        elif provider == "bedrock":
            from app.engine.connectors.bedrock import BedrockConnector
            _INSTANCES[provider] = BedrockConnector()
        elif provider == "vertex_ai":
            from app.engine.connectors.vertex_ai import VertexAIConnector
            _INSTANCES[provider] = VertexAIConnector()
    return _INSTANCES[provider]
