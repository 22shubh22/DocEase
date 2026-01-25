"""Change visit_date from Date to DateTime to include time

Revision ID: 0006_visit_date_to_datetime
Revises: 0005_merge_rx_into_visit
Create Date: 2026-01-24

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0006_visit_date_to_datetime'
down_revision: Union[str, None] = '0005_merge_rx_into_visit'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Change visit_date column from Date to DateTime with timezone
    # Existing dates will be converted to datetime at midnight (00:00:00)
    op.alter_column('visits', 'visit_date',
        existing_type=sa.Date(),
        type_=sa.DateTime(timezone=True),
        existing_nullable=False
    )


def downgrade() -> None:
    # Change back from DateTime to Date (will lose time information)
    op.alter_column('visits', 'visit_date',
        existing_type=sa.DateTime(timezone=True),
        type_=sa.Date(),
        existing_nullable=False
    )
