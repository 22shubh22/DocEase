"""Add amount column to visits table

Revision ID: 0010_add_amount
Revises: 0009_remove_quantity
Create Date: 2026-01-25

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0010_add_amount'
down_revision: Union[str, None] = '0009_remove_quantity'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add amount column to visits table (nullable for backward compatibility)
    op.add_column('visits', sa.Column('amount', sa.Numeric(10, 2), nullable=True))


def downgrade() -> None:
    # Remove amount column from visits table
    op.drop_column('visits', 'amount')
