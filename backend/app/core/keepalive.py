"""
Periodic keep-alive task to prevent Supabase free-tier database from pausing.
Supabase pauses free projects after 7 days of inactivity.
Runs as an asyncio background task within the FastAPI lifespan.
"""

import asyncio
import logging

from sqlalchemy import text

from app.core.config import settings
from app.core.database import SessionLocal
from app.services.guest_service import cleanup_expired_guests

logger = logging.getLogger(__name__)


async def db_keep_alive() -> None:
    """
    Periodically ping the database with SELECT 1 and clean up expired
    guest sessions. Designed to be spawned as an asyncio.Task and
    cancelled on shutdown.
    """
    interval_seconds = settings.KEEP_ALIVE_INTERVAL_HOURS * 3600
    logger.info(
        "Database keep-alive task started (interval: %d hours)",
        settings.KEEP_ALIVE_INTERVAL_HOURS,
    )

    while True:
        # Run cleanup first, then sleep — ensures it runs immediately on startup
        # and after every Railway restart (before the first interval elapses)
        try:
            await asyncio.get_event_loop().run_in_executor(None, _ping_and_cleanup)
        except Exception:
            logger.exception("Keep-alive ping failed")

        try:
            await asyncio.sleep(interval_seconds)
        except asyncio.CancelledError:
            logger.info("Database keep-alive task cancelled, shutting down")
            return


def _ping_and_cleanup() -> None:
    """Synchronous helper: ping DB and clean up expired guest sessions."""
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        logger.info("Keep-alive ping: database is responsive")

        count = cleanup_expired_guests(db)
        if count > 0:
            logger.info("Keep-alive cleanup: removed %d expired guest session(s)", count)
    finally:
        db.close()
