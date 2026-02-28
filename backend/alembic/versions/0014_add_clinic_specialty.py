"""Add specialty column to clinics table

Revision ID: 0014_clinic_specialty
Revises: 0013_remove_invoice
Create Date: 2026-02-28

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0014_clinic_specialty'
down_revision: Union[str, None] = '0013_remove_invoice'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE TYPE clinicspecialtyenum AS ENUM ('dental', 'dermatology', 'general_physician', 'pediatrics', 'orthopedics')")

    op.add_column('clinics',
        sa.Column('specialty', sa.Enum('dental', 'dermatology', 'general_physician', 'pediatrics', 'orthopedics', name='clinicspecialtyenum'),
                  nullable=True))

    # Backfill existing clinics as 'dental'
    op.execute("UPDATE clinics SET specialty = 'dental' WHERE specialty IS NULL")


def downgrade() -> None:
    op.drop_column('clinics', 'specialty')
    op.execute("DROP TYPE IF EXISTS clinicspecialtyenum")
