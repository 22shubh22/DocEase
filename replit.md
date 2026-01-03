# DocEase - Clinic Management System

A comprehensive clinic management system built with FastAPI (backend) and React (frontend) for managing patients, OPD queues, prescriptions, and billing.

## Overview

**Purpose**: Complete clinic management solution for doctors and medical assistants
**Status**: Fully configured and running on Replit
**Tech Stack**: 
- Backend: FastAPI + PostgreSQL + SQLAlchemy
- Frontend: React + Vite + Tailwind CSS + React Query
- Database: PostgreSQL (Replit managed)

## Recent Changes (December 7, 2025)

### Replit Environment Setup
- Configured Python 3.11 and Node.js 20
- Set up PostgreSQL database with Replit's managed service
- Fixed import paths (app.routes → app.api)
- Fixed bcrypt/passlib compatibility by using bcrypt directly
- Fixed missing dependencies (email-validator, HTTPAuthorizationCredentials)
- Added get_current_doctor dependency function
- Configured frontend Vite to use port 5000 with 0.0.0.0 host and allowedHosts: true for Replit proxy
- Updated API configuration to use relative paths (/api)
- Seeded database with initial demo data
- Configured deployment for autoscale with unified backend serving frontend static files

### Deployment Configuration
- **Target**: Autoscale
- **Build**: Builds frontend (npm install && npm run build), installs backend dependencies
- **Run**: FastAPI serves both API and frontend static files on port 5000
- **Note**: In production, FastAPI serves the built React frontend from `/frontend/dist`

### Database
- Created clinic, doctor, assistant, and 3 demo patients
- Login credentials:
  - Doctor: `doctor@clinic.com` / `doctor123`
  - Assistant: `assistant@clinic.com` / `assistant123`

## Project Architecture

### Backend Structure
```
backend/
├── app/
│   ├── api/           # API route handlers
│   ├── core/          # Core configuration and dependencies
│   ├── crud/          # Database CRUD operations
│   ├── db/            # Database configuration
│   ├── models/        # SQLAlchemy models
│   ├── schemas/       # Pydantic schemas
│   └── main.py        # FastAPI application entry point
├── requirements.txt   # Python dependencies
└── seed.py           # Database seeding script
```

### Frontend Structure
```
frontend/
├── src/
│   ├── components/    # React components
│   ├── pages/         # Page components
│   ├── services/      # API service layer
│   └── store/         # Zustand state management
├── package.json       # Node.js dependencies
└── vite.config.js    # Vite configuration
```

## Key Features

### MVP Features (All Implemented)
- User Authentication (JWT-based with role-based access control)
- Patient Management (CRUD operations)
- OPD Queue Management (Real-time queue tracking)
- Visit & Doctor Notes
- Prescription Management
- PDF Prescription Generation
- Billing & Invoice Management
- Clinic Settings
- Mobile Responsive Design

## Development Setup

### Workflows
1. **Backend API** - Runs on 0.0.0.0:8000
   - Command: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000`
   - Access API docs at: http://localhost:8000/docs

2. **Frontend** - Runs on 0.0.0.0:5000 (public-facing)
   - Command: `cd frontend && npm run dev`
   - User interface accessible via Replit webview

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (auto-configured by Replit)
- `SECRET_KEY` - JWT secret key (required, configured in environment)

## User Preferences

No specific user preferences documented yet.

## Notes

- Backend uses 0.0.0.0:8000 for development, 0.0.0.0:5000 for production deployment
- Frontend uses 0.0.0.0:5000 for Replit proxy compatibility in development
- In production, FastAPI serves the built frontend static files from /frontend/dist
- Frontend proxy forwards /api requests to backend at localhost:8000 (development only)
- CORS is configured to allow all origins for development
- Database is seeded with demo data on first run
- Passlib with bcrypt 4.0.1 is used for password hashing
- SECRET_KEY is required and must be set in environment (no default for security)
