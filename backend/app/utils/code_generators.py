from sqlalchemy.orm import Session
from app.models.models import Doctor


def generate_doctor_code(db: Session) -> str:
    """
    Generate globally unique doctor code (DR-0001, DR-0002, etc.)
    Queries all doctors across all clinics to ensure uniqueness.
    """
    max_num = 0
    all_doctors = db.query(Doctor).all()
    for d in all_doctors:
        if d.doctor_code and '-' in d.doctor_code:
            try:
                num = int(d.doctor_code.split('-')[1])
                if num > max_num:
                    max_num = num
            except (ValueError, IndexError):
                continue
    return f"DR-{str(max_num + 1).zfill(4)}"
