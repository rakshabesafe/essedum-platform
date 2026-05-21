from typing import Any
from app.engine.executors.base import BaseExecutor


class ChatInputExecutor(BaseExecutor):
    """Passes the execution's initial user message downstream."""

    async def execute(
        self,
        node: dict,
        inputs: dict[str, Any],
        context: dict[str, Any],
    ) -> dict[str, Any]:
        message = context.get("input", {}).get("message", "")
        return {"message": message}
