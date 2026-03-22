"""Add guardian fields to patients table for minor patients.

Revision ID: 0025_add_patient_guardian_fields
Revises: 0024_add_google_auth
Create Date: 2026-03-22

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0025_add_patient_guardian_fields'
down_revision: Union[str, None] = '0024_add_google_auth'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('patients', sa.Column('guardian_name', sa.String(), nullable=True))
    op.add_column('patients', sa.Column('guardian_phone', sa.String(), nullable=True))
    op.add_column('patients', sa.Column('guardian_relationship', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('patients', 'guardian_relationship')
    op.drop_column('patients', 'guardian_phone')
    op.drop_column('patients', 'guardian_name')
