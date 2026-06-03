from typing import Any
from app.engine.executors.base import BaseExecutor
from app.engine.connectors import get_connector


class ModelExecutor(BaseExecutor):
    """Calls Azure OpenAI, AWS Bedrock, or Google Vertex AI."""

    async def execute(
        self,
        node: dict,
        inputs: dict[str, Any],
        context: dict[str, Any],
    ) -> dict[str, Any]:
        config: dict = (node.get("data") or {}).get("config") or {}
        provider: str = config["provider"]
        model: str = config["model"]
        temperature: float = float(config.get("temperature", 0.7))
        max_tokens: int = int(config.get("max_tokens", 1000))

        # Resolve prompt text
        prompt_text: str = (
            inputs.get("prompt")
            or inputs.get("message")
            or inputs.get("input")
            or ""
        )
        system_text: str = (
            inputs.get("system_message")
            or config.get("system_message")
            or ""
        )

        messages: list[dict[str, str]] = []
        if system_text:
            messages.append({"role": "system", "content": system_text})
        messages.append({"role": "user", "content": prompt_text})

        connector = get_connector(provider)
        response = await connector.chat(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return {"response": response}
