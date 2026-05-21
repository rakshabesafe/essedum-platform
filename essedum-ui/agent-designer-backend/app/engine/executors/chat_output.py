from typing import Any
from app.engine.executors.base import BaseExecutor


class ChatOutputExecutor(BaseExecutor):
    """Terminal node — collects the final response text."""

    async def execute(
        self,
        node: dict,
        inputs: dict[str, Any],
        context: dict[str, Any],
    ) -> dict[str, Any]:
        # Accept any of: message, response, answer, result, output
        message = (
            inputs.get("message")
            or inputs.get("response")
            or inputs.get("answer")
            or inputs.get("result")
            or inputs.get("output")
            or inputs.get("input")
            or ""
        )
        return {"output": message}
