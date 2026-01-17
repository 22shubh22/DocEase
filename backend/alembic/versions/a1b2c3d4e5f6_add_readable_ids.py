"""add_readable_ids_for_clinic_and_doctor

Revision ID: a1b2c3d4e5f6
Revises: ff376cc25216
Create Date: 2026-01-17 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'ff376cc25216'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add clinic_code column to clinics table
    op.add_column('clinics', sa.Column('clinic_code', sa.String(), nullable=True))
    op.create_index(op.f('ix_clinics_clinic_code'), 'clinics', ['clinic_code'], unique=True)

    # Add doctor_code column to doctors table
    op.add_column('doctors', sa.Column('doctor_code', sa.String(), nullable=True))
    op.create_index(op.f('ix_doctors_doctor_code'), 'doctors', ['doctor_code'], unique=True)

    # Populate existing records with readable codes
    # Using raw SQL for data migration
    connection = op.get_bind()

    # Get all clinics ordered by created_at and assign codes
    clinics = connection.execute(sa.text("SELECT id FROM clinics ORDER BY created_at")).fetchall()
    for i, clinic in enumerate(clinics, 1):
        connection.execute(
            sa.text("UPDATE clinics SET clinic_code = :code WHERE id = :id"),
            {"code": f"CL-{str(i).zfill(4)}", "id": clinic[0]}
        )

    # Get all doctors ordered by created_at and assign codes
    doctors = connection.execute(sa.text("SELECT id FROM doctors ORDER BY created_at")).fetchall()
    for i, doctor in enumerate(doctors, 1):
        connection.execute(
            sa.text("UPDATE doctors SET doctor_code = :code WHERE id = :id"),
            {"code": f"DR-{str(i).zfill(4)}", "id": doctor[0]}
        )


def downgrade() -> None:
    op.drop_index(op.f('ix_doctors_doctor_code'), table_name='doctors')
    op.drop_column('doctors', 'doctor_code')
    op.drop_index(op.f('ix_clinics_clinic_code'), table_name='clinics')
    op.drop_column('clinics', 'clinic_code')
