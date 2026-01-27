"""Convert chief_complaint to chief_complaints array in appointments table

Revision ID: 0008_chief_complaints_array
Revises: 0007_array_fields
Create Date: 2026-01-25

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '0008_chief_complaints_array'
down_revision: Union[str, None] = '0007_array_fields'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Convert chief_complaint from String to ARRAY(String)
    # First, add a temporary column
    op.add_column('appointments', sa.Column('chief_complaints', postgresql.ARRAY(sa.String()), nullable=True))

    # Copy data: convert existing text to single-element array
    op.execute("""
        UPDATE appointments
        SET chief_complaints = CASE
            WHEN chief_complaint IS NOT NULL AND chief_complaint != '' THEN ARRAY[chief_complaint]
            ELSE ARRAY[]::varchar[]
        END
    """)

    # Drop old column
    op.drop_column('appointments', 'chief_complaint')


def downgrade() -> None:
    # Convert chief_complaints back to single String (join array elements)
    op.add_column('appointments', sa.Column('chief_complaint', sa.String(), nullable=True))

    op.execute("""
        UPDATE appointments
        SET chief_complaint = CASE
            WHEN chief_complaints IS NOT NULL AND array_length(chief_complaints, 1) > 0
            THEN array_to_string(chief_complaints, ', ')
            ELSE NULL
        END
    """)

    # Drop array column
    op.drop_column('appointments', 'chief_complaints')
