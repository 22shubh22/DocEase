from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_size=3,          # Reduce persistent connections (Supabase pooler has limits)
    max_overflow=2,       # Limit overflow connections
    pool_recycle=300,     # Recycle connections every 5 minutes
    pool_pre_ping=True,   # Validate connections before use
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
