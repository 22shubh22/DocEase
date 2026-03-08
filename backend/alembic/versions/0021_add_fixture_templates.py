"""Add fixture_templates table for admin-editable specialty templates

Revision ID: 0021_add_fixture_templates
Revises: 0020_add_clinic_daily_stats
Create Date: 2026-03-08

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
import uuid

# revision identifiers, used by Alembic.
revision: str = '0021_add_fixture_templates'
down_revision: Union[str, None] = '0020_add_clinic_daily_stats'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS fixture_templates (
            id VARCHAR NOT NULL,
            specialty VARCHAR NOT NULL,
            category VARCHAR NOT NULL,
            name VARCHAR NOT NULL,
            description VARCHAR,
            display_order INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ,
            PRIMARY KEY (id)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_fixture_templates_specialty ON fixture_templates (specialty)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_fixture_templates_category ON fixture_templates (category)")

    # Seed from existing Python fixture files
    from app.fixtures.template_registry import get_template

    conn = op.get_bind()
    specialties = ["dental", "dermatology", "general_physician"]
    for specialty in specialties:
        template = get_template(specialty)
        for category, items in template.items():
            for item in items:
                conn.execute(
                    sa.text(
                        "INSERT INTO fixture_templates (id, specialty, category, name, description, display_order, is_active) "
                        "VALUES (:id, :specialty, :category, :name, :description, :display_order, TRUE)"
                    ),
                    {
                        "id": str(uuid.uuid4()),
                        "specialty": specialty,
                        "category": category,
                        "name": item["name"],
                        "description": item["description"],
                        "display_order": item["display_order"],
                    }
                )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS fixture_templates")
