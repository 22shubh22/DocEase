"""Convert symptoms, diagnosis, observations to arrays and add symptom_options table

Revision ID: 0007_array_fields
Revises: 0006_visit_date_to_datetime
Create Date: 2026-01-25

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '0007_array_fields'
down_revision: Union[str, None] = '0006_visit_date_to_datetime'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create symptom_options table
    op.create_table('symptom_options',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('display_order', sa.Integer(), nullable=True, default=0),
        sa.Column('clinic_id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['clinic_id'], ['clinics.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Convert symptoms from Text to ARRAY(String)
    # First, add a temporary column
    op.add_column('visits', sa.Column('symptoms_array', postgresql.ARRAY(sa.String()), nullable=True))
    # Copy data: convert existing text to single-element array
    op.execute("""
        UPDATE visits
        SET symptoms_array = CASE
            WHEN symptoms IS NOT NULL AND symptoms != '' THEN ARRAY[symptoms]
            ELSE ARRAY[]::varchar[]
        END
    """)
    # Drop old column and rename new one
    op.drop_column('visits', 'symptoms')
    op.alter_column('visits', 'symptoms_array', new_column_name='symptoms')

    # Convert diagnosis from Text to ARRAY(String)
    op.add_column('visits', sa.Column('diagnosis_array', postgresql.ARRAY(sa.String()), nullable=True))
    op.execute("""
        UPDATE visits
        SET diagnosis_array = CASE
            WHEN diagnosis IS NOT NULL AND diagnosis != '' THEN ARRAY[diagnosis]
            ELSE ARRAY[]::varchar[]
        END
    """)
    op.drop_column('visits', 'diagnosis')
    op.alter_column('visits', 'diagnosis_array', new_column_name='diagnosis')

    # Convert observations from Text to ARRAY(String)
    op.add_column('visits', sa.Column('observations_array', postgresql.ARRAY(sa.String()), nullable=True))
    op.execute("""
        UPDATE visits
        SET observations_array = CASE
            WHEN observations IS NOT NULL AND observations != '' THEN ARRAY[observations]
            ELSE ARRAY[]::varchar[]
        END
    """)
    op.drop_column('visits', 'observations')
    op.alter_column('visits', 'observations_array', new_column_name='observations')


def downgrade() -> None:
    # Convert symptoms back to Text (take first element or join)
    op.add_column('visits', sa.Column('symptoms_text', sa.Text(), nullable=True))
    op.execute("""
        UPDATE visits
        SET symptoms_text = CASE
            WHEN symptoms IS NOT NULL AND array_length(symptoms, 1) > 0
            THEN array_to_string(symptoms, ', ')
            ELSE NULL
        END
    """)
    op.drop_column('visits', 'symptoms')
    op.alter_column('visits', 'symptoms_text', new_column_name='symptoms')

    # Convert diagnosis back to Text
    op.add_column('visits', sa.Column('diagnosis_text', sa.Text(), nullable=True))
    op.execute("""
        UPDATE visits
        SET diagnosis_text = CASE
            WHEN diagnosis IS NOT NULL AND array_length(diagnosis, 1) > 0
            THEN array_to_string(diagnosis, ', ')
            ELSE NULL
        END
    """)
    op.drop_column('visits', 'diagnosis')
    op.alter_column('visits', 'diagnosis_text', new_column_name='diagnosis')

    # Convert observations back to Text
    op.add_column('visits', sa.Column('observations_text', sa.Text(), nullable=True))
    op.execute("""
        UPDATE visits
        SET observations_text = CASE
            WHEN observations IS NOT NULL AND array_length(observations, 1) > 0
            THEN array_to_string(observations, ', ')
            ELSE NULL
        END
    """)
    op.drop_column('visits', 'observations')
    op.alter_column('visits', 'observations_text', new_column_name='observations')

    # Drop symptom_options table
    op.drop_table('symptom_options')
