"""Add print_templates table for custom print template design

Revision ID: 0017_add_print_templates
Revises: 0016_add_is_guest
Create Date: 2026-03-01

"""
from typing import Sequence, Union
from alembic import op
import json
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON

# revision identifiers, used by Alembic.
revision: str = '0017_add_print_templates'
down_revision: Union[str, None] = '0016_add_is_guest'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

DEFAULT_TEMPLATE_CONFIG = {
    "header": {
        "show_logo": True,
        "show_clinic_name": True,
        "show_address": True,
        "show_phone": True,
        "show_email": False,
        "show_doctor_name": True,
        "show_qualification": True,
        "show_registration": True,
        "show_specialization": True,
        "logo_position": "left",
        "custom_tagline": ""
    },
    "footer": {
        "show_signature_image": True,
        "show_signature_line": True,
        "show_doctor_name": True,
        "show_clinic_contact": True,
        "custom_footer_text": ""
    },
    "watermark": {
        "enabled": False,
        "opacity": 0.05,
        "use_logo": True
    }
}


def upgrade() -> None:
    op.create_table(
        'print_templates',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('clinic_id', sa.String(), nullable=False),
        sa.Column('print_mode', sa.String(), nullable=False, server_default='letterhead'),
        sa.Column('preset_id', sa.String(), nullable=False, server_default='classic'),
        sa.Column('content_top_px', sa.Integer(), nullable=False, server_default='280'),
        sa.Column('content_left_px', sa.Integer(), nullable=False, server_default='40'),
        sa.Column('content_right_px', sa.Integer(), nullable=False, server_default='40'),
        sa.Column('template_config', JSON(), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True)),
        sa.ForeignKeyConstraint(['clinic_id'], ['clinics.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('clinic_id')
    )

    # Insert a default print template for every existing clinic
    config_json = json.dumps(DEFAULT_TEMPLATE_CONFIG)
    op.execute(
        sa.text("""
            INSERT INTO print_templates (id, clinic_id, print_mode, preset_id, content_top_px, content_left_px, content_right_px, template_config)
            SELECT gen_random_uuid()::text, id, 'letterhead', 'classic', 280, 40, 40, CAST(:config AS json)
            FROM clinics
        """).bindparams(sa.bindparam('config', value=config_json, type_=sa.String))
    )


def downgrade() -> None:
    op.drop_table('print_templates')
