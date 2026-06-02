from typing import Any
from app.engine.executors.base import BaseExecutor


class PromptExecutor(BaseExecutor):
    """
    Formats a prompt template using Python str.format_map.

    Template syntax: use {input}, {message}, {history}, or any
    key that arrives in the inputs dict.
    """

    async def execute(
        self,
        node: dict,
        inputs: dict[str, Any],
        context: dict[str, Any],
    ) -> dict[str, Any]:
        config: dict = (node.get("data") or {}).get("config") or {}
        template: str = config.get("template", "{input}")
        system_message: str | None = config.get("system_message")

        # Build substitution map: inputs + context variables
        sub_map: dict[str, Any] = {**inputs}
        # Flatten history list to readable string if present
        if "history" in sub_map and isinstance(sub_map["history"], list):
            sub_map["history"] = "\n".join(
                f"{e.get('role','?')}: {e.get('content','')}"
                for e in sub_map["history"]
            )

        try:
            formatted = template.format_map(sub_map)
        except KeyError as exc:
            raise ValueError(
                f"Prompt template references undefined variable: {exc}"
            ) from exc

        return {
            "prompt": formatted,
            "system_message": system_message or "",
        }
