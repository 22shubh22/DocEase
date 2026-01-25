from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_doctor
from app.core.security import get_password_hash
from app.models.models import User
from app.schemas.schemas import UserCreate, UserUpdate, UserResponse

router = APIRouter()


@router.get("/", response_model=dict)
async def get_all_users(
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """Get all users (doctor only)"""
    users = db.query(User).filter(User.clinic_id == current_user.clinic_id).all()

    user_list = [
        {
            "id": user.id,
            "email": user.email,
            "role": user.role.value,
            "full_name": user.full_name,
            "phone": user.phone,
            "is_active": user.is_active,
            "created_at": user.created_at,
            "last_login": user.last_login
        }
        for user in users
    ]

    return {"users": user_list}


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """Create a new user (doctor only)"""
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )

    # Create new user
    new_user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        role=user_data.role,
        full_name=user_data.full_name,
        phone=user_data.phone,
        clinic_id=current_user.clinic_id
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User created successfully",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "role": new_user.role.value,
            "full_name": new_user.full_name,
            "phone": new_user.phone,
            "is_active": new_user.is_active
        }
    }


@router.put("/{user_id}", response_model=dict)
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """Update user (doctor only)"""
    user = db.query(User).filter(
        User.id == user_id,
        User.clinic_id == current_user.clinic_id
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = user_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)

    return {
        "message": "User updated successfully",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role.value,
            "full_name": user.full_name,
            "phone": user.phone,
            "is_active": user.is_active
        }
    }


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """Delete user (doctor only)"""
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )

    user = db.query(User).filter(
        User.id == user_id,
        User.clinic_id == current_user.clinic_id
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()

    return {"message": "User deleted successfully"}
