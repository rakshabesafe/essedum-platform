from typing import Any
import asyncio
from openai import AsyncAzureOpenAI
from app.config import settings


class AzureOpenAIConnector:
    """Handles chat completions and embeddings via Azure OpenAI."""

    def _get_client(self, api_key: str | None = None, endpoint: str | None = None) -> AsyncAzureOpenAI:
        return AsyncAzureOpenAI(
            api_key=api_key or settings.azure_openai_api_key,
            azure_endpoint=endpoint or settings.azure_openai_endpoint,
            api_version=settings.azure_openai_api_version,
        )

    async def chat(
        self,
        model: str,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 1000,
        api_key: str | None = None,
        endpoint: str | None = None,
        **kwargs: Any,
    ) -> str:
        client = self._get_client(api_key, endpoint)
        response = await client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content or ""

    async def embed(
        self,
        texts: list[str],
        model: str = "text-embedding-3-small",
        api_key: str | None = None,
        endpoint: str | None = None,
    ) -> list[list[float]]:
        client = self._get_client(api_key, endpoint)
        response = await client.embeddings.create(model=model, input=texts)
        return [item.embedding for item in response.data]

    async def list_models(self, api_key: str | None = None, endpoint: str | None = None) -> list[str]:
        client = self._get_client(api_key, endpoint)
        models = await client.models.list()
        return [m.id for m in models.data]
