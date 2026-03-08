"""Admin API for managing fixture templates (specialty-level defaults for new clinics)."""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Optional
from collections import defaultdict

from app.core.deps import get_db, get_current_user
from app.models.models import User, RoleEnum, FixtureTemplate
from app.schemas.schemas import (
    FixtureTemplateCreate, FixtureTemplateUpdate, FixtureTemplateResponse,
    VALID_CATEGORIES
)
from app.fixtures.template_registry import get_template

router = APIRouter()


def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


@router.get("")
def list_fixture_templates(
    specialty: str = Query(..., description="Clinic specialty to list templates for"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """List all fixture templates for a specialty, grouped by category."""
    templates = db.query(FixtureTemplate).filter(
        and_(
            FixtureTemplate.specialty == specialty,
            FixtureTemplate.is_active == True
        )
    ).order_by(FixtureTemplate.category, FixtureTemplate.display_order).all()

    categories = defaultdict(list)
    for t in templates:
        categories[t.category].append(FixtureTemplateResponse.model_validate(t).model_dump())

    # Ensure all categories are present (even if empty)
    for cat in VALID_CATEGORIES:
        if cat not in categories:
            categories[cat] = []

    return {
        "specialty": specialty,
        "categories": dict(categories)
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def create_fixture_template(
    data: FixtureTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Add a new fixture template item."""
    template = FixtureTemplate(
        specialty=data.specialty,
        category=data.category,
        name=data.name,
        description=data.description,
        display_order=data.display_order,
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return FixtureTemplateResponse.model_validate(template)


@router.put("/{template_id}")
def update_fixture_template(
    template_id: str,
    data: FixtureTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update an existing fixture template item."""
    template = db.query(FixtureTemplate).filter(FixtureTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template item not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(template, key, value)

    db.commit()
    db.refresh(template)
    return FixtureTemplateResponse.model_validate(template)


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_fixture_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete a fixture template item."""
    template = db.query(FixtureTemplate).filter(FixtureTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template item not found")

    db.delete(template)
    db.commit()


@router.post("/reset")
def reset_fixture_templates(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Reset a specialty's templates back to Python file defaults."""
    specialty = data.get("specialty")
    if not specialty:
        raise HTTPException(status_code=400, detail="specialty is required")

    # Delete existing templates for this specialty
    db.query(FixtureTemplate).filter(FixtureTemplate.specialty == specialty).delete()

    # Re-seed from Python fixture files
    template = get_template(specialty)
    count = 0
    for category, items in template.items():
        for item in items:
            db.add(FixtureTemplate(
                specialty=specialty,
                category=category,
                name=item["name"],
                description=item["description"],
                display_order=item["display_order"],
            ))
            count += 1

    db.commit()
    return {"message": f"Reset {count} template items for {specialty}"}
