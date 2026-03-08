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
from app.api import auth, patients, opd, visits, clinic, users, admin, chief_complaints, diagnosis_options, observation_options, test_options, medicine_options, dosage_options, duration_options, symptom_options, permissions, onboarding, print_template
from app.services.guest_service import cleanup_expired_guests
from app.core.keepalive import db_keep_alive

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def mask_database_url(url: str) -> str:
    """Mask password in database URL for safe logging."""
    return re.sub(r'://([^:]+):([^@]+)@', r'://\1:****@', url)

logger.info(f"Starting DocEase API with DATABASE_URL: {mask_database_url(settings.DATABASE_URL)}")

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

    # Start background keep-alive task to prevent Supabase from pausing
    keep_alive_task = asyncio.create_task(db_keep_alive())

    yield

    # Shutdown: cancel keep-alive, then dispose connections
    keep_alive_task.cancel()
    try:
        await keep_alive_task
    except asyncio.CancelledError:
        pass
    logger.info("Keep-alive task stopped")

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
