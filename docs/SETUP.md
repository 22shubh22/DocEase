# DocEase Setup Guide

## Complete Installation Instructions

### 1. Clone/Download Project

```bash
cd /path/to/DocEase
```

### 2. Database Setup

```bash
# Install PostgreSQL (if not installed)
# macOS
brew install postgresql@15

# Ubuntu/Debian
sudo apt-get install postgresql-15

# Start PostgreSQL
brew services start postgresql@15  # macOS
sudo service postgresql start       # Linux

# Create database
createdb docease

# Or using psql
psql -U postgres
CREATE DATABASE docease;
\q
```

### 3. Backend Setup (FastAPI)

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env and update DATABASE_URL
nano .env  # or use your preferred editor
# DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/docease
# SECRET_KEY=change-this-to-a-random-32-char-string

# Note: The backend code is partially complete
# You'll need to complete the schemas and routes
# See backend/TODO.md for remaining tasks
```

### 4. Frontend Setup (React)

```bash
cd ../frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on http://localhost:3000

### 5. Verify Installation

1. Backend API Docs: http://localhost:8000/docs
2. Frontend: http://localhost:3000
3. Health Check: http://localhost:8000/health

## Project Status

**Backend**: Core structure created ✅
- Database models: Complete
- API routes: Need to be completed
- Schemas: Need to be completed

**Frontend**: Structure created ✅
- React setup: Complete
- Components: Need to be built
- Pages: Need to be built

## Next Development Steps

1. Complete backend API routes (see backend/TODO.md)
2. Complete Pydantic schemas
3. Build frontend components
4. Build frontend pages
5. Integrate frontend with backend API

Estimated time to complete: 40-60 hours of development

