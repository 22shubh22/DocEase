import logging
import re
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api import auth, patients, opd, visits, invoices, clinic, users, admin, chief_complaints, diagnosis_options, observation_options, test_options, medicine_options, dosage_options, duration_options, symptom_options, permissions

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def mask_database_url(url: str) -> str:
    """Mask password in database URL for safe logging."""
    return re.sub(r'://([^:]+):([^@]+)@', r'://\1:****@', url)

logger.info(f"Starting DocEase API with DATABASE_URL: {mask_database_url(settings.DATABASE_URL)}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created, connection pool initialized")
    yield
    # Shutdown: dispose all connections
    engine.dispose()
    logger.info("Database connections disposed")

app = FastAPI(
    title="DocEase API",
    description="Clinic Management System API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware - use environment-based origins for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(patients.router, prefix="/api/patients", tags=["Patients"])
app.include_router(opd.router, prefix="/api/opd", tags=["OPD"])
app.include_router(visits.router, prefix="/api/visits", tags=["Visits"])
app.include_router(invoices.router, prefix="/api/invoices", tags=["Invoices"])
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

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "DocEase API is running"}

@app.get("/")
async def root():
    return {"message": "Welcome to DocEase API", "docs": "/docs"}
