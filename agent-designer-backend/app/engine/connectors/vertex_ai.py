import asyncio
import os
from typing import Any
from app.config import settings


class VertexAIConnector:
    """Handles chat completions and embeddings via Google Vertex AI."""

    def _init_vertexai(self, project: str | None = None, location: str | None = None):
        import vertexai

        if settings.google_application_credentials:
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = (
                settings.google_application_credentials
            )
        vertexai.init(
            project=project or settings.google_project_id,
            location=location or settings.google_location,
        )

    async def chat(
        self,
        model: str,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 1000,
        project: str | None = None,
        location: str | None = None,
        **kwargs: Any,
    ) -> str:
        from vertexai.generative_models import GenerativeModel, Content, Part

        self._init_vertexai(project, location)

        system_parts = [m["content"] for m in messages if m["role"] == "system"]
        history = [
            Content(
                role="user" if m["role"] == "user" else "model",
                parts=[Part.from_text(m["content"])],
            )
            for m in messages
            if m["role"] != "system"
        ]

        def _call():
            gm = GenerativeModel(
                model,
                system_instruction="\n".join(system_parts) if system_parts else None,
            )
            response = gm.generate_content(
                history,
                generation_config={
                    "temperature": temperature,
                    "max_output_tokens": max_tokens,
                },
            )
            return response.text

        return await asyncio.to_thread(_call)

    async def embed(
        self,
        texts: list[str],
        model: str = "text-embedding-005",
        project: str | None = None,
        location: str | None = None,
    ) -> list[list[float]]:
        from vertexai.language_models import TextEmbeddingModel

        self._init_vertexai(project, location)

        def _call():
            em = TextEmbeddingModel.from_pretrained(model)
            return [e.values for e in em.get_embeddings(texts)]

        return await asyncio.to_thread(_call)

    async def list_models(self, **kwargs: Any) -> list[str]:
        return [
            "gemini-1.5-pro-002",
            "gemini-1.5-flash-002",
            "gemini-2.0-flash",
            "gemini-2.5-pro-preview-05-06",
        ]
