"""Make onboarding request fields nullable for simplified form

Revision ID: 0015_simplify_onboarding
Revises: 0014_clinic_specialty
Create Date: 2026-02-28

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0015_simplify_onboarding'
down_revision: Union[str, None] = '0014_clinic_specialty'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Columns to make nullable (were previously NOT NULL)
NULLABLE_COLUMNS = [
    'specialization',
    'qualification',
    'registration_number',
    'clinic_address',
    'clinic_city',
    'clinic_state',
    'clinic_pincode',
]


def upgrade() -> None:
    with op.batch_alter_table('onboarding_requests') as batch_op:
        for col in NULLABLE_COLUMNS:
            batch_op.alter_column(col, existing_type=sa.String(), nullable=True)
        batch_op.alter_column(
            'clinic_specialty',
            existing_type=sa.Enum('dental', 'dermatology', 'general_physician', 'pediatrics', 'orthopedics', name='clinicspecialtyenum'),
            nullable=True,
        )


def downgrade() -> None:
    with op.batch_alter_table('onboarding_requests') as batch_op:
        for col in NULLABLE_COLUMNS:
            batch_op.alter_column(col, existing_type=sa.String(), nullable=False)
        batch_op.alter_column(
            'clinic_specialty',
            existing_type=sa.Enum('dental', 'dermatology', 'general_physician', 'pediatrics', 'orthopedics', name='clinicspecialtyenum'),
            nullable=False,
        )
