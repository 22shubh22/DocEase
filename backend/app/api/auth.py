import logging
import time
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.deps import get_current_user
from app.models.models import User
from app.schemas.schemas import LoginRequest, Token, ChangePasswordRequest, UserResponse
from app.services.guest_service import create_guest_session, cleanup_guest_session

logger = logging.getLogger(__name__)

router = APIRouter()

# Simple in-memory rate limiter for guest endpoint
_guest_requests: list[float] = []
GUEST_RATE_LIMIT = 10  # max requests
GUEST_RATE_WINDOW = 60  # per 60 seconds


@router.post("/login", response_model=dict)
async def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """Authenticate user and return access token"""
    user = db.query(User).filter(User.email == login_data.email).first()

    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()

    # Create access token
    access_token = create_access_token(data={"sub": user.id, "role": user.role.value})

    return {
        "message": "Login successful",
        "token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value,
            "clinic_id": user.clinic_id,
            "is_guest": user.is_guest,
        }
    }


@router.post("/guest")
async def guest_login(db: Session = Depends(get_db)):
    """Create a guest demo session with isolated clinic and pre-loaded data"""
    # Rate limiting
    now = time.time()
    _guest_requests[:] = [t for t in _guest_requests if now - t < GUEST_RATE_WINDOW]
    if len(_guest_requests) >= GUEST_RATE_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many guest sessions. Please try again later.",
        )
    _guest_requests.append(now)

    try:
        return create_guest_session(db)
    except Exception as e:
        logger.error(f"Failed to create guest session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create guest session. Please try again.",
        )


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Logout user. For guest users, also cleans up all demo data."""
    if current_user.is_guest:
        try:
            cleanup_guest_session(db, current_user.id)
            logger.info(f"Cleaned up guest session for user {current_user.id}")
        except Exception as e:
            logger.error(f"Failed to cleanup guest session: {e}")

    return {"message": "Logout successful"}


@router.get("/me", response_model=dict)
async def get_profile(
    current_user: User = Depends(get_current_user)
):
    """Get current user profile"""
    return {
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "phone": current_user.phone,
            "role": current_user.role.value,
            "clinic_id": current_user.clinic_id,
            "is_active": current_user.is_active,
            "is_guest": current_user.is_guest,
            "last_login": current_user.last_login,
        }
    }


@router.post("/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    if current_user.is_guest:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Guest accounts cannot change password",
        )

    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect",
        )

    current_user.password_hash = get_password_hash(password_data.new_password)
    db.commit()

    return {"message": "Password changed successfully"}
