from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.deps import get_current_user
from app.models.models import User
from app.schemas.schemas import LoginRequest, Token, ChangePasswordRequest, UserResponse

router = APIRouter()


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
        }
    }


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Logout user (client should delete token)"""
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
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect",
        )

    current_user.password_hash = get_password_hash(password_data.new_password)
    db.commit()

    return {"message": "Password changed successfully"}
