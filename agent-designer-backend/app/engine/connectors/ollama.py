from typing import Any
from openai import AsyncOpenAI
from app.config import settings


class OllamaConnector:
    """Handles chat completions via Ollama's OpenAI-compatible API."""

    def _get_client(self) -> AsyncOpenAI:
        return AsyncOpenAI(
            base_url=settings.ollama_base_url,
            api_key="ollama",  # Ollama doesn't need a real key
        )

    async def chat(
        self,
        model: str,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 1000,
        **kwargs: Any,
    ) -> str:
        client = self._get_client()
        response = await client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content or ""

    async def list_models(self) -> list[str]:
        client = self._get_client()
        models = await client.models.list()
        return [m.id for m in models.data]
