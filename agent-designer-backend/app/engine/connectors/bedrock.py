import asyncio
import json
from typing import Any
from app.config import settings


class BedrockConnector:
    """Handles chat completions and embeddings via AWS Bedrock (sync boto3, wrapped async)."""

    def _get_client(
        self,
        access_key: str | None = None,
        secret_key: str | None = None,
        region: str | None = None,
    ):
        import boto3
        return boto3.client(
            service_name="bedrock-runtime",
            region_name=region or settings.aws_region,
            aws_access_key_id=access_key or settings.aws_access_key_id,
            aws_secret_access_key=secret_key or settings.aws_secret_access_key,
        )

    async def chat(
        self,
        model: str,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 1000,
        access_key: str | None = None,
        secret_key: str | None = None,
        region: str | None = None,
        **kwargs: Any,
    ) -> str:
        client = self._get_client(access_key, secret_key, region)

        # Build Bedrock Converse API payload (supported by Claude, Llama, Mistral, etc.)
        def _call():
            return client.converse(
                modelId=model,
                messages=[
                    {"role": m["role"], "content": [{"text": m["content"]}]}
                    for m in messages
                    if m["role"] != "system"
                ],
                system=[
                    {"text": m["content"]}
                    for m in messages
                    if m["role"] == "system"
                ] or [],
                inferenceConfig={
                    "temperature": temperature,
                    "maxTokens": max_tokens,
                },
            )

        response = await asyncio.to_thread(_call)
        return response["output"]["message"]["content"][0]["text"]

    async def embed(
        self,
        texts: list[str],
        model: str = "amazon.titan-embed-text-v2:0",
        access_key: str | None = None,
        secret_key: str | None = None,
        region: str | None = None,
    ) -> list[list[float]]:
        client = self._get_client(access_key, secret_key, region)

        async def _embed_single(text: str) -> list[float]:
            body = json.dumps({"inputText": text})
            response = await asyncio.to_thread(
                client.invoke_model,
                modelId=model,
                body=body,
                contentType="application/json",
                accept="application/json",
            )
            result = json.loads(response["body"].read())
            return result["embedding"]

        return await asyncio.gather(*[_embed_single(t) for t in texts])

    async def list_models(self, **kwargs: Any) -> list[str]:
        # Static list of commonly used Bedrock models
        return [
            "anthropic.claude-3-5-sonnet-20241022-v2:0",
            "anthropic.claude-3-haiku-20240307-v1:0",
            "amazon.titan-text-express-v1",
            "meta.llama3-70b-instruct-v1:0",
        ]
