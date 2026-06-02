from fastapi import APIRouter
from pydantic import BaseModel
from app.engine.connectors import get_connector

router = APIRouter(prefix="/llm", tags=["llm"])


class ChatRequest(BaseModel):
    provider: str
    model: str
    messages: list[dict]
    temperature: float = 0.7
    max_tokens: int = 1000


class TestRequest(BaseModel):
    provider: str
    model: str | None = None


@router.post("/chat")
async def chat_endpoint(request: ChatRequest):
    connector = get_connector(request.provider)
    response = await connector.chat(
        model=request.model,
        messages=request.messages,
        temperature=request.temperature,
        max_tokens=request.max_tokens,
    )
    return {"response": response}


@router.get("/models")
async def list_models(provider: str):
    connector = get_connector(provider)
    return {"provider": provider, "models": await connector.list_models()}


@router.post("/test")
async def test_connection(request: TestRequest):
    connector = get_connector(request.provider)
    model = request.model or (await connector.list_models())[0]
    await connector.chat(
        model=model,
        messages=[{"role": "user", "content": "ping"}],
        max_tokens=5,
    )
    return {"status": "ok", "provider": request.provider}
