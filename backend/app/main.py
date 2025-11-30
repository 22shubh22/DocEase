from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.routes import auth, patients, opd, visits, prescriptions, invoices, clinic, users

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="DocEase API",
    description="Clinic Management System API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(patients.router, prefix="/api/patients", tags=["Patients"])
app.include_router(opd.router, prefix="/api/opd", tags=["OPD"])
app.include_router(visits.router, prefix="/api/visits", tags=["Visits"])
app.include_router(prescriptions.router, prefix="/api/prescriptions", tags=["Prescriptions"])
app.include_router(invoices.router, prefix="/api/invoices", tags=["Invoices"])
app.include_router(clinic.router, prefix="/api/clinic", tags=["Clinic"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "DocEase API is running"}

@app.get("/")
async def root():
    return {"message": "Welcome to DocEase API"}
