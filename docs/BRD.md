Business Requirements Document (BRD)
Doctor Clinic Management App

1. Project Overview

The Doctor Clinic Management App is a mobile-first application designed for small to medium clinics. It allows a doctor and an assistant to manage patients, OPD flow, prescriptions, and clinic operations efficiently from a single admin interface with role-based permissions.

2. Users & Roles
2.1 Doctor (Primary Admin)
* Full access to all features and settings.
* Can create/update/delete patients and OPD records.
* Can create/update prescriptions.
* Can manage users and permissions.
* Clinic-level settings control.

2.2 Assistant

* Limited access as defined by doctor.
* Can create/manage patients.
* Can manage OPD queue.
* Can enter patient vitals.
* Cannot modify doctor profile, clinic settings, or delete prescriptions.

3. Core Modules & Requirements
3.1 Patient Management

* Create and manage patient profiles.
* Fields include: Name, age, gender
* Phone number & emergency contact
* Address
* Allergies & medical history

Manage patient case sheets:
* Visit history
* Previous prescriptions
* Previous diagnoses

Upload and store reports:

* Images (X-ray, scan)
* PDFs (lab reports)

Search/filter patients by:

* Name, phone
* Age
* Last visit date


3.2 OPD & Appointment Management

Appointment scheduling (optional)

OPD queue management:

Current patient

Next patient

Mark as “Visited / Not Visited”

Assign follow-up dates.

Quick patient selection for doctor during OPD.

Track number of patients seen in a day.

3.3 Doctor Notes & Prescription Management

Add doctor notes per visit:

Symptoms

Diagnosis

Observations

Recommended tests

Create prescriptions:

Medicine name

Dosage

Duration

Instructions

Save prescription templates for common cases.

Generate PDF prescriptions:

With clinic logo & branding

With doctor’s digital signature

Share via WhatsApp or print.

3.4 Billing & Payment Tracking (Optional Module)

Record consultation fees.

Mark as paid/unpaid.

Track payment modes (Cash / UPI / Card).

View daily earnings and analytics.

Export earnings report.

3.5 User & Permission Management

Add/edit/remove assistant users.

Apply permission roles:

Read-only access

Create-only access

No delete access

Limited modules access

Track login activity.

3.6 Clinic Settings & Admin Panel

Clinic profile:

Name, address, contact number

Clinic logo

OPD timings

Manage doctor profile:

Name, specialization

Signature upload

Data export (PDF/CSV).

Backup & recovery options.