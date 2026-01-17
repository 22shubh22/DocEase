"""Add chief_complaint to appointments

Revision ID: c639c6900bc9
Revises: f008910a9304
Create Date: 2026-01-17 08:07:53.554563

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = 'c639c6900bc9'
down_revision: Union[str, None] = 'f008910a9304'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('appointments', sa.Column('chief_complaint', sa.String(), nullable=True))
    
    conn = op.get_bind()
    
    clinics_constraint_exists = conn.execute(text(
        "SELECT 1 FROM information_schema.table_constraints "
        "WHERE constraint_name = 'clinics_clinic_code_key' AND table_name = 'clinics'"
    )).fetchone()
    if clinics_constraint_exists:
        op.drop_constraint('clinics_clinic_code_key', 'clinics', type_='unique')
    
    clinics_index_exists = conn.execute(text(
        "SELECT 1 FROM pg_indexes WHERE indexname = 'ix_clinics_clinic_code'"
    )).fetchone()
    if not clinics_index_exists:
        op.create_index(op.f('ix_clinics_clinic_code'), 'clinics', ['clinic_code'], unique=True)
    
    doctors_constraint_exists = conn.execute(text(
        "SELECT 1 FROM information_schema.table_constraints "
        "WHERE constraint_name = 'doctors_doctor_code_key' AND table_name = 'doctors'"
    )).fetchone()
    if doctors_constraint_exists:
        op.drop_constraint('doctors_doctor_code_key', 'doctors', type_='unique')
    
    doctors_index_exists = conn.execute(text(
        "SELECT 1 FROM pg_indexes WHERE indexname = 'ix_doctors_doctor_code'"
    )).fetchone()
    if not doctors_index_exists:
        op.create_index(op.f('ix_doctors_doctor_code'), 'doctors', ['doctor_code'], unique=True)


def downgrade() -> None:
    conn = op.get_bind()
    
    doctors_index_exists = conn.execute(text(
        "SELECT 1 FROM pg_indexes WHERE indexname = 'ix_doctors_doctor_code'"
    )).fetchone()
    if doctors_index_exists:
        op.drop_index(op.f('ix_doctors_doctor_code'), table_name='doctors')
    
    doctors_constraint_exists = conn.execute(text(
        "SELECT 1 FROM information_schema.table_constraints "
        "WHERE constraint_name = 'doctors_doctor_code_key' AND table_name = 'doctors'"
    )).fetchone()
    if not doctors_constraint_exists:
        op.create_unique_constraint('doctors_doctor_code_key', 'doctors', ['doctor_code'])
    
    clinics_index_exists = conn.execute(text(
        "SELECT 1 FROM pg_indexes WHERE indexname = 'ix_clinics_clinic_code'"
    )).fetchone()
    if clinics_index_exists:
        op.drop_index(op.f('ix_clinics_clinic_code'), table_name='clinics')
    
    clinics_constraint_exists = conn.execute(text(
        "SELECT 1 FROM information_schema.table_constraints "
        "WHERE constraint_name = 'clinics_clinic_code_key' AND table_name = 'clinics'"
    )).fetchone()
    if not clinics_constraint_exists:
        op.create_unique_constraint('clinics_clinic_code_key', 'clinics', ['clinic_code'])
    
    op.drop_column('appointments', 'chief_complaint')
