from typing import AsyncGenerator, Any
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis
try:
    from qdrant_client import AsyncQdrantClient as _AsyncQdrantClient
except ImportError:
    _AsyncQdrantClient = None  # type: ignore[assignment,misc]

from app.db.session import AsyncSessionLocal
from app.config import settings

# ─── Database ────────────────────────────────────────────────────────────────

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ─── Redis ────────────────────────────────────────────────────────────────────

_redis_client: Redis | None = None


async def get_redis() -> Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = Redis.from_url(settings.redis_url, decode_responses=True)
    return _redis_client


# ─── Qdrant ──────────────────────────────────────────────────────────────────

_qdrant_client: Any = None


async def get_qdrant() -> Any:
    global _qdrant_client
    if _AsyncQdrantClient is None:
        raise RuntimeError("qdrant-client is not installed. Install it to use RAG endpoints.")
    if _qdrant_client is None:
        _qdrant_client = _AsyncQdrantClient(
            host=settings.qdrant_host,
            port=settings.qdrant_port,
            api_key=settings.qdrant_api_key,
            prefer_grpc=settings.qdrant_use_grpc,
        )
    return _qdrant_client
