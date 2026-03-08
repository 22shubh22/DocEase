import asyncio
import logging
import re
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api import auth, patients, opd, visits, clinic, users, admin, chief_complaints, diagnosis_options, observation_options, test_options, medicine_options, dosage_options, duration_options, symptom_options, permissions, onboarding, print_template, audit, dpdp, fixture_templates
from app.services.guest_service import cleanup_expired_guests
from app.core.keepalive import db_keep_alive
from app.services.analytics_service import compute_all_clinics_daily, backfill_stats

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def mask_database_url(url: str) -> str:
    """Mask password in database URL for safe logging."""
    return re.sub(r'://([^:]+):([^@]+)@', r'://\1:****@', url)

logger.info(f"Starting DocEase API with DATABASE_URL: {mask_database_url(settings.DATABASE_URL)}")

async def _daily_stats_worker():
    """Background worker that computes daily stats at midnight + 5 min."""
    from datetime import datetime, timedelta, date
    from app.core.database import SessionLocal as _WorkerSession

    while True:
        try:
            # Sleep until next midnight + 5 minutes
            now = datetime.now()
            tomorrow = (now + timedelta(days=1)).replace(hour=0, minute=5, second=0, microsecond=0)
            sleep_seconds = (tomorrow - now).total_seconds()
            await asyncio.sleep(sleep_seconds)

            # Compute yesterday's stats
            yesterday = date.today() - timedelta(days=1)
            db = _WorkerSession()
            try:
                count = compute_all_clinics_daily(db, yesterday)
                logger.info(f"Daily stats worker: computed stats for {count} clinic(s) for {yesterday}")
            finally:
                db.close()
        except asyncio.CancelledError:
            logger.info("Daily stats worker cancelled")
            return
        except Exception:
            logger.exception("Daily stats worker error")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created, connection pool initialized")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")

    # Cleanup expired guest sessions from previous runs
    try:
        from app.core.database import SessionLocal
        db = SessionLocal()
        count = cleanup_expired_guests(db)
        if count > 0:
            logger.info(f"Cleaned up {count} expired guest session(s)")
        db.close()
    except Exception as e:
        logger.error(f"Failed to cleanup expired guest sessions: {e}")

    # Compute usage stats on startup
    try:
        from app.core.database import SessionLocal as _StatsSession
        from datetime import date, timedelta, datetime
        from app.models.models import ClinicDailyStats
        stats_db = _StatsSession()
        today = date.today()
        yesterday = today - timedelta(days=1)

        # If no stats exist yet, backfill last 90 days
        stats_count = stats_db.query(ClinicDailyStats).count()
        if stats_count == 0:
            date_from = today - timedelta(days=90)
            total = backfill_stats(stats_db, date_from, today)
            logger.info(f"Initial backfill: computed {total} stat rows for last 90 days")
        else:
            count = compute_all_clinics_daily(stats_db, yesterday)
            if count > 0:
                logger.info(f"Computed daily stats for {count} clinic(s) for {yesterday}")
            # Also compute today's partial stats so dashboard is current
            count = compute_all_clinics_daily(stats_db, today)
            if count > 0:
                logger.info(f"Computed partial daily stats for {count} clinic(s) for {today}")

        stats_db.close()
    except Exception as e:
        logger.error(f"Failed to compute daily stats on startup: {e}")

    # Start background keep-alive task to prevent Supabase from pausing
    keep_alive_task = asyncio.create_task(db_keep_alive())

    # Start daily stats worker
    daily_stats_task = asyncio.create_task(_daily_stats_worker())

    yield

    # Shutdown: cancel background tasks, then dispose connections
    keep_alive_task.cancel()
    daily_stats_task.cancel()
    try:
        await keep_alive_task
    except asyncio.CancelledError:
        pass
    try:
        await daily_stats_task
    except asyncio.CancelledError:
        pass
    logger.info("Background tasks stopped")

    engine.dispose()
    logger.info("Database connections disposed")

limiter = Limiter(key_func=get_remote_address, default_limits=["300/minute"])

app = FastAPI(
    title="DocEase API",
    description="Clinic Management System API",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware - use environment-based origins for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting middleware - 300 requests/minute per IP
app.add_middleware(SlowAPIMiddleware)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(patients.router, prefix="/api/patients", tags=["Patients"])
app.include_router(opd.router, prefix="/api/opd", tags=["OPD"])
app.include_router(visits.router, prefix="/api/visits", tags=["Visits"])
app.include_router(clinic.router, prefix="/api/clinic", tags=["Clinic"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(chief_complaints.router, prefix="/api/chief-complaints", tags=["Chief Complaints"])
app.include_router(diagnosis_options.router, prefix="/api/diagnosis-options", tags=["Diagnosis Options"])
app.include_router(observation_options.router, prefix="/api/observation-options", tags=["Observation Options"])
app.include_router(test_options.router, prefix="/api/test-options", tags=["Test Options"])
app.include_router(medicine_options.router, prefix="/api/medicine-options", tags=["Medicine Options"])
app.include_router(dosage_options.router, prefix="/api/dosage-options", tags=["Dosage Options"])
app.include_router(duration_options.router, prefix="/api/duration-options", tags=["Duration Options"])
app.include_router(symptom_options.router, prefix="/api/symptom-options", tags=["Symptom Options"])
app.include_router(permissions.router, prefix="/api/permissions", tags=["Permissions"])
app.include_router(onboarding.router, prefix="/api/onboarding", tags=["Onboarding"])
app.include_router(print_template.router, prefix="/api/print-template", tags=["Print Template"])
app.include_router(audit.router, prefix="/api/audit", tags=["Audit"])
app.include_router(dpdp.router, prefix="/api/dpdp", tags=["DPDP Compliance"])
app.include_router(fixture_templates.router, prefix="/api/admin/fixture-templates", tags=["Fixture Templates"])

@app.get("/health")
async def health_check():
    from sqlalchemy import text
    from app.core.database import SessionLocal
    db_ok = False
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db_ok = True
        db.close()
    except Exception:
        pass
    return {
        "status": "ok" if db_ok else "degraded",
        "database": "connected" if db_ok else "unreachable",
        "message": "DocEase API is running",
    }

@app.get("/")
async def root():
    return {"message": "Welcome to DocEase API", "docs": "/docs"}
