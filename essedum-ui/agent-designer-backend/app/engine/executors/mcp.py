import json
from typing import Any
from app.engine.executors.base import BaseExecutor


class MCPExecutor(BaseExecutor):
    """
    Invokes a tool on an MCP-compatible server using the mcp Python SDK.
    Supports HTTP/SSE transport (Streamable HTTP).
    """

    async def execute(
        self,
        node: dict,
        inputs: dict[str, Any],
        context: dict[str, Any],
    ) -> dict[str, Any]:
        from mcp import ClientSession
        from mcp.client.streamable_http import streamablehttp_client

        config: dict = (node.get("data") or {}).get("config") or {}
        server_url: str = config["server_url"]
        tool_name: str = config["tool_name"]

        # Static extra arguments merged with the live input
        static_args: dict = config.get("arguments") or {}

        input_value = (
            inputs.get("input")
            or inputs.get("message")
            or inputs.get("prompt")
            or ""
        )

        # Build tool arguments
        tool_args: dict = {**static_args, "input": input_value}

        async with streamablehttp_client(server_url) as (read, write, _):
            async with ClientSession(read, write) as session:
                await session.initialize()
                result = await session.call_tool(tool_name, arguments=tool_args)

        # result.content is a list of content blocks; join text parts
        parts = [
            block.text
            for block in (result.content or [])
            if hasattr(block, "text")
        ]
        return {"result": "\n".join(parts)}
