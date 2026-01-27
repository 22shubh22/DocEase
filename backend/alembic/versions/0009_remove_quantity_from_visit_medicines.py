"""Remove quantity column from visit_medicines table

Revision ID: 0009_remove_quantity
Revises: 0008_chief_complaints_array
Create Date: 2026-01-25

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0009_remove_quantity'
down_revision: Union[str, None] = '0008_chief_complaints_array'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Remove quantity column from visit_medicines table
    op.drop_column('visit_medicines', 'quantity')


def downgrade() -> None:
    # Re-add quantity column to visit_medicines table
    op.add_column('visit_medicines', sa.Column('quantity', sa.Integer(), nullable=True))
