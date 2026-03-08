from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user, require_permission
from app.models.models import User, PrintTemplate
from app.schemas.schemas import PrintTemplateUpdate, PrintTemplateResponse, PrintModeSwitchRequest, ApplyPresetRequest
from app.services.print_presets import get_preset, DEFAULT_TEMPLATE_CONFIG

router = APIRouter()


def get_or_create_template(clinic_id: str, db: Session) -> PrintTemplate:
    """Get the clinic's print template, creating a default one if it doesn't exist."""
    template = db.query(PrintTemplate).filter(
        PrintTemplate.clinic_id == clinic_id
    ).first()

    if not template:
        template = PrintTemplate(
            clinic_id=clinic_id,
            print_mode="letterhead",
            preset_id="classic",
            content_top_px=280,
            content_left_px=40,
            content_right_px=40,
            template_config=DEFAULT_TEMPLATE_CONFIG,
        )
        db.add(template)
        db.commit()
        db.refresh(template)

    return template


@router.get("/", response_model=PrintTemplateResponse)
async def get_print_template(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the clinic's print template configuration."""
    template = get_or_create_template(current_user.clinic_id, db)
    return template


@router.put("/", response_model=PrintTemplateResponse)
async def update_print_template(
    data: PrintTemplateUpdate,
    current_user: User = Depends(require_permission("can_edit_print_settings")),
    db: Session = Depends(get_db)
):
    """Update the clinic's print template configuration."""
    template = get_or_create_template(current_user.clinic_id, db)

    update_data = data.model_dump(exclude_unset=True)

    # Handle template_config merge (deep merge into existing config)
    if "template_config" in update_data and update_data["template_config"]:
        existing_config = template.template_config or {}
        new_config = update_data.pop("template_config")
        for section_key, section_value in new_config.items():
            if isinstance(section_value, dict) and isinstance(existing_config.get(section_key), dict):
                existing_config[section_key] = {**existing_config[section_key], **section_value}
            else:
                existing_config[section_key] = section_value
        template.template_config = existing_config

    # Update top-level fields
    for field, value in update_data.items():
        setattr(template, field, value)

    db.commit()
    db.refresh(template)
    return template


@router.patch("/mode", response_model=PrintTemplateResponse)
async def switch_print_mode(
    data: PrintModeSwitchRequest,
    current_user: User = Depends(require_permission("can_edit_print_settings")),
    db: Session = Depends(get_db)
):
    """Quick toggle between letterhead and digital print mode."""
    template = get_or_create_template(current_user.clinic_id, db)
    template.print_mode = data.print_mode
    db.commit()
    db.refresh(template)
    return template


@router.post("/apply-preset", response_model=PrintTemplateResponse)
async def apply_preset(
    data: ApplyPresetRequest,
    current_user: User = Depends(require_permission("can_edit_print_settings")),
    db: Session = Depends(get_db)
):
    """Apply a preset template, replacing the current template_config."""
    template = get_or_create_template(current_user.clinic_id, db)
    template.preset_id = data.preset_id
    template.template_config = get_preset(data.preset_id)
    db.commit()
    db.refresh(template)
    return template
