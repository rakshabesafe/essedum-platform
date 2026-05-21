import logging
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db

logger = logging.getLogger(__name__)
router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.get("/health/ready")
async def ready(db: AsyncSession = Depends(get_db)):
    checks: dict = {}

    # Database check
    try:
        await db.execute(text("SELECT 1"))
        checks["db"] = "ok"
    except Exception as exc:
        checks["db"] = str(exc)

    # Redis check (optional — no hard failure)
    try:
        from app.dependencies import get_redis
        redis = await get_redis()
        await redis.ping()
        checks["redis"] = "ok"
    except Exception as exc:
        logger.warning("Redis unavailable: %s", exc)
        checks["redis"] = "unavailable"

    overall = "ready" if checks["db"] == "ok" else "degraded"
    return {"status": overall, "checks": checks}
