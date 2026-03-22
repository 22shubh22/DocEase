"""Make patient codes unique per clinic instead of globally unique.

Renumbers existing patients per clinic ordered by created_at,
so the first-created patient in each clinic gets PT-0001.
Also adds is_deleted column for soft delete support.

Revision ID: 0026_clinic_scoped_patient_codes
Revises: 0025_add_patient_guardian_fields
Create Date: 2026-03-22

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0026_clinic_scoped_patient_codes'
down_revision: Union[str, None] = '0025_add_patient_guardian_fields'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop the old globally-unique index first (needed before renumbering to avoid conflicts)
    op.drop_index('ix_patients_patient_code', table_name='patients')

    # Renumber existing patients per clinic, ordered by created_at
    conn = op.get_bind()

    # Get distinct clinic IDs
    clinics = conn.execute(
        sa.text("SELECT DISTINCT clinic_id FROM patients")
    ).fetchall()

    for (clinic_id,) in clinics:
        # Get patients for this clinic ordered by creation time
        patients = conn.execute(
            sa.text(
                "SELECT id FROM patients WHERE clinic_id = :clinic_id "
                "ORDER BY created_at ASC"
            ),
            {"clinic_id": clinic_id}
        ).fetchall()

        for i, (patient_id,) in enumerate(patients, start=1):
            new_code = f"PT-{str(i).zfill(4)}"
            conn.execute(
                sa.text(
                    "UPDATE patients SET patient_code = :code WHERE id = :id"
                ),
                {"code": new_code, "id": patient_id}
            )

    # Add composite unique constraint (clinic_id + patient_code)
    op.create_unique_constraint(
        'uq_clinic_patient_code',
        'patients',
        ['clinic_id', 'patient_code']
    )

    # Re-add patient_code index as non-unique (for search performance)
    op.create_index('ix_patients_patient_code', 'patients', ['patient_code'], unique=False)

    # Add soft delete column
    op.add_column('patients', sa.Column(
        'is_deleted', sa.Boolean(), nullable=False, server_default=sa.text('false')
    ))


def downgrade() -> None:
    op.drop_column('patients', 'is_deleted')
    op.drop_index('ix_patients_patient_code', table_name='patients')
    op.drop_constraint('uq_clinic_patient_code', 'patients', type_='unique')
    op.create_index('ix_patients_patient_code', 'patients', ['patient_code'], unique=True)
