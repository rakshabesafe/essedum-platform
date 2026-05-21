import logging
from app.db.session import engine
from app.db.base import Base

logger = logging.getLogger("agentflow")


async def on_startup() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    logger.info("AgentFlow API starting up…")
    # Tables are managed by Alembic in production.
    # For local dev convenience, create tables automatically.
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables verified.")


async def on_shutdown() -> None:
    logger.info("AgentFlow API shutting down…")
    await engine.dispose()
