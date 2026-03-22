"""Add default_dosage and default_duration to medicine_options.

Allows medicines to have linked default dosage and duration values
that auto-fill when a doctor selects the medicine in the prescription form.

Revision ID: 0027_add_medicine_defaults
Revises: 0026_clinic_scoped_patient_codes
Create Date: 2026-03-22

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0027_add_medicine_defaults'
down_revision: Union[str, None] = '0026_clinic_scoped_patient_codes'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('medicine_options', sa.Column('default_dosage', sa.String(), nullable=True))
    op.add_column('medicine_options', sa.Column('default_duration', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('medicine_options', 'default_duration')
    op.drop_column('medicine_options', 'default_dosage')
