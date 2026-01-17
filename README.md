# DocEase - Clinic Management System

A comprehensive clinic management system built with **FastAPI** (backend) and **React** (frontend) for managing patients, OPD queues, prescriptions, and billing.

## 🏗️ Architecture

- **Backend**: FastAPI + PostgreSQL + SQLAlchemy
- **Frontend**: React + Vite + Tailwind CSS + React Query
- **Database**: PostgreSQL
- **Authentication**: JWT-based auth with role-based access control

## 📋 Features

### MVP Features
✅ User Authentication (Doctor & Assistant roles)
✅ Patient Management (CRUD operations)
✅ OPD Queue Management (Real-time queue tracking)
✅ Visit & Doctor Notes
✅ Prescription Management
✅ PDF Prescription Generation
✅ Billing & Invoice Management
✅ Clinic Settings
✅ Mobile Responsive Design

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- PostgreSQL 15+ (with `docease` database created)
- Node.js 18+

### Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
./run.sh
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install   # first time only
npm run dev
```

### URLs
- **Frontend**: http://localhost:5000
- **Admin Portal**: http://localhost:5000/admin (login with admin credentials)
- **Backend API**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/docs

### Manual Start (alternative)

```bash
# Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend (separate terminal)
cd frontend
npm run dev
```

See SETUP.md for detailed first-time setup instructions.

## 🔑 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@docease.com` | `admin123` |
| Doctor | `doctor@clinic.com` | `doctor123` |
| Assistant | `assistant@clinic.com` | `assistant123` |

**Super Admin Portal**: System-wide administration, user management, and platform settings.

**Doctor Portal**: Full access to patient records, prescriptions, billing, and clinic settings.

**Assistant Portal**: Access to OPD queue management, patient registration, and billing.

## 📄 License
MIT License

