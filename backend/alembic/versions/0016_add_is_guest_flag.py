"""Add is_guest flag to clinics and users tables

Revision ID: 0016_add_is_guest
Revises: 0015_simplify_onboarding
Create Date: 2026-03-01

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0016_add_is_guest'
down_revision: Union[str, None] = '0015_simplify_onboarding'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('clinics', sa.Column('is_guest', sa.Boolean(), nullable=False, server_default=sa.text('false')))
    op.add_column('users', sa.Column('is_guest', sa.Boolean(), nullable=False, server_default=sa.text('false')))


def downgrade() -> None:
    op.drop_column('users', 'is_guest')
    op.drop_column('clinics', 'is_guest')
