#!/usr/bin/env python3
"""
Generate DBML for dbdiagram.io from SQLAlchemy models.
Output can be copied directly into https://dbdiagram.io
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import inspect
from app.models.models import (
    Clinic, User, Doctor, Patient, Appointment, Visit, VisitMedicine,
    Invoice, InvoiceItem, ClinicAdmin, ChiefComplaint, DiagnosisOption,
    ObservationOption, TestOption, MedicineOption, DosageOption, DurationOption,
    RoleEnum, GenderEnum, AppointmentStatusEnum, PaymentStatusEnum, PaymentModeEnum
)


def sqlalchemy_type_to_dbml(col_type):
    """Convert SQLAlchemy type to DBML type."""
    type_str = str(col_type).upper()
    if 'VARCHAR' in type_str or 'TEXT' in type_str or 'STRING' in type_str:
        return 'varchar'
    elif 'INTEGER' in type_str or 'INT' in type_str:
        return 'int'
    elif 'BOOLEAN' in type_str:
        return 'boolean'
    elif 'DATETIME' in type_str:
        return 'datetime'
    elif 'DATE' in type_str:
        return 'date'
    elif 'NUMERIC' in type_str or 'DECIMAL' in type_str:
        return 'decimal'
    elif 'JSON' in type_str:
        return 'json'
    elif 'ARRAY' in type_str:
        return 'varchar[]'
    elif 'ENUM' in type_str or 'roleenum' in type_str.lower() or 'gender' in type_str.lower() or 'status' in type_str.lower() or 'mode' in type_str.lower():
        return 'varchar'
    return 'varchar'


def generate_table_dbml(model_class):
    """Generate DBML for a single table."""
    mapper = inspect(model_class)
    table = mapper.mapped_table
    lines = [f"Table {table.name} {{"]

    for column in table.columns:
        col_type = sqlalchemy_type_to_dbml(column.type)
        settings = []

        if column.primary_key:
            settings.append("pk")
        if not column.nullable and not column.primary_key:
            settings.append("not null")
        if column.unique and not column.primary_key:
            settings.append("unique")

        # Add note for enums
        type_str = str(column.type).lower()
        if 'enum' in type_str:
            if 'role' in column.name:
                settings.append("note: 'DOCTOR, ASSISTANT, ADMIN'")
            elif 'gender' in column.name:
                settings.append("note: 'MALE, FEMALE, OTHER'")
            elif 'status' in column.name and 'payment' in column.name:
                settings.append("note: 'PAID, UNPAID, PARTIAL'")
            elif 'status' in column.name:
                settings.append("note: 'WAITING, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW'")
            elif 'mode' in column.name:
                settings.append("note: 'CASH, UPI, CARD, OTHER'")

        settings_str = f" [{', '.join(settings)}]" if settings else ""
        lines.append(f"  {column.name} {col_type}{settings_str}")

    lines.append("}")
    return "\n".join(lines)


def generate_relationships_dbml(models):
    """Generate DBML relationship definitions."""
    relationships = []
    seen = set()

    for model_class in models:
        mapper = inspect(model_class)
        table = mapper.mapped_table

        for column in table.columns:
            if column.foreign_keys:
                fk = list(column.foreign_keys)[0]
                ref_table = fk.column.table.name
                ref_col = fk.column.name

                # Determine relationship type
                rel_type = ">" if not column.unique else "-"

                key = (table.name, column.name, ref_table, ref_col)
                if key not in seen:
                    seen.add(key)
                    relationships.append(f"Ref: {table.name}.{column.name} {rel_type} {ref_table}.{ref_col}")

    return "\n".join(relationships)


def main():
    models = [
        Clinic, User, Doctor, Patient, Appointment, Visit, VisitMedicine,
        Invoice, InvoiceItem, ClinicAdmin, ChiefComplaint, DiagnosisOption,
        ObservationOption, TestOption, MedicineOption, DosageOption, DurationOption
    ]

    lines = []
    lines.append("// DocEase Database Schema")
    lines.append("// Generated for dbdiagram.io")
    lines.append("// Copy everything below into https://dbdiagram.io/d")
    lines.append("")

    # Generate enums as notes
    lines.append("// Enums:")
    lines.append("// RoleEnum: DOCTOR, ASSISTANT, ADMIN")
    lines.append("// GenderEnum: MALE, FEMALE, OTHER")
    lines.append("// AppointmentStatusEnum: WAITING, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW")
    lines.append("// PaymentStatusEnum: PAID, UNPAID, PARTIAL")
    lines.append("// PaymentModeEnum: CASH, UPI, CARD, OTHER")
    lines.append("")

    # Generate tables
    for model in models:
        lines.append(generate_table_dbml(model))
        lines.append("")

    # Generate relationships
    lines.append("// Relationships")
    lines.append(generate_relationships_dbml(models))

    output = "\n".join(lines)

    # Write to file
    output_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "docs", "schema.dbml")
    os.makedirs(os.path.dirname(output_file), exist_ok=True)

    with open(output_file, "w") as f:
        f.write(output)

    print(f"DBML schema written to: {output_file}")


if __name__ == "__main__":
    main()
