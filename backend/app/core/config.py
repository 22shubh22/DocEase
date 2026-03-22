from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    KEEP_ALIVE_INTERVAL_HOURS: int = 1
    FRONTEND_URL: str = "http://localhost:3000"

    # Audit & DPDP
    AUDIT_LOG_READ_EVENTS: bool = False
    DEFAULT_RETENTION_MONTHS: int = 120

    # Notifications
    NOTIFICATIONS_ENABLED: bool = True  # Global kill switch

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""

    # CORS origins - comma-separated list for production
    CORS_ORIGINS: str = "http://localhost:5000,http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS_ORIGINS string into a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"

settings = Settings()
