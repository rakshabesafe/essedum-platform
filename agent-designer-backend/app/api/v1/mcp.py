from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/mcp", tags=["mcp"])


class MCPTestRequest(BaseModel):
    server_url: str
    tool_name: str | None = None


@router.post("/test")
async def test_mcp_connection(request: MCPTestRequest):
    from mcp import ClientSession
    from mcp.client.streamable_http import streamablehttp_client

    async with streamablehttp_client(request.server_url) as (read, write, _):
        async with ClientSession(read, write) as session:
            await session.initialize()
            tools = await session.list_tools()
            tool_names = [t.name for t in (tools.tools or [])]

    return {"status": "ok", "server_url": request.server_url, "tools": tool_names}


@router.get("/servers/{server_url:path}/tools")
async def list_mcp_tools(server_url: str):
    from mcp import ClientSession
    from mcp.client.streamable_http import streamablehttp_client

    async with streamablehttp_client(server_url) as (read, write, _):
        async with ClientSession(read, write) as session:
            await session.initialize()
            tools = await session.list_tools()

    return {
        "tools": [
            {"name": t.name, "description": t.description, "schema": t.inputSchema}
            for t in (tools.tools or [])
        ]
    }
