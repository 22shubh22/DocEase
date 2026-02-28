# DocEase Deployment Guide

This document covers the deployment setup for DocEase - a Clinic Management System.

## Architecture Overview

```
┌─────────────────────┐         ┌─────────────────────┐
│   Vercel (Frontend) │ ──API──▶│  Railway (Backend)  │
│   React + Vite SPA  │         │   FastAPI + Python  │
└─────────────────────┘         └──────────┬──────────┘
                                           │
                                           ▼
                                ┌─────────────────────┐
                                │  Supabase (Database)│
                                │     PostgreSQL      │
                                └─────────────────────┘
```

## Production URLs

| Service  | URL |
|----------|-----|
| Frontend | https://doc-ease-eight.vercel.app |
| Backend  | https://docease-production-05b0.up.railway.app |
| API Docs | https://docease-production-05b0.up.railway.app/docs |
| Health   | https://docease-production-05b0.up.railway.app/health |

---

## Backend Deployment (Railway)

### Platform
- **Host**: Railway (https://railway.app)
- **Runtime**: Docker container
- **Framework**: FastAPI with Uvicorn

### Configuration Files

**Dockerfile** (`backend/Dockerfile`):
```dockerfile
FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
```

### Environment Variables (Railway)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (Supabase) |
| `SECRET_KEY` | JWT signing secret |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `PORT` | (Auto-set by Railway) |

Example `CORS_ORIGINS`:
```
https://doc-ease-eight.vercel.app,http://localhost:5000,http://localhost:3000
```

### Networking Setup

**Important**: Ensure the public networking port matches the port your app listens on.

1. Go to Railway → Service → Settings → Networking
2. Verify the port number matches `${PORT}` used by Uvicorn
3. The deploy logs show which port the app is running on

### Troubleshooting

**"Application failed to respond" error:**
- Check deploy logs for the actual port (e.g., `Uvicorn running on http://0.0.0.0:8080`)
- Update Railway's Networking settings to match that port
- Ensure `PORT` environment variable is not hardcoded incorrectly

**Container stops after health check:**
- Check for database connection errors in logs
- Verify `DATABASE_URL` is correct
- Ensure Supabase allows connections from Railway IPs

---

## Frontend Deployment (Vercel)

### Platform
- **Host**: Vercel (https://vercel.com)
- **Framework**: React 18 + Vite (SPA)
- **Build Output**: Static files in `dist/`

### Configuration Files

**vercel.json** (`frontend/vercel.json`):
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

### Setup Steps

1. Go to Vercel → Add New Project
2. Import GitHub repository
3. **Set Root Directory to `frontend`** (monorepo setup)
4. Add environment variable:
   - `VITE_API_URL` = `https://docease-production-05b0.up.railway.app/api`
5. Deploy

### Environment Variables (Vercel)

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://docease-production-05b0.up.railway.app/api` |

**Note**: Vite requires environment variables to be prefixed with `VITE_` to be exposed to the client.

### Troubleshooting

**CORS errors:**
- Add your Vercel domain to Railway's `CORS_ORIGINS` variable
- Format: `https://your-app.vercel.app` (no trailing slash)

**404 on page refresh:**
- Ensure `vercel.json` has the rewrite rule for SPA routing
- The rule `"/(.*)" → "/index.html"` handles client-side routing

---

## Database (Supabase)

### Connection String Format
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

### Connection Pooling
- Use the **pooler** connection string for serverless/container deployments
- Pooler URL format: `*.pooler.supabase.com`

---

## Local Development

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
cp .env.example .env      # Configure your local .env
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev               # Runs on http://localhost:5000
```

The frontend dev server proxies `/api` requests to `http://localhost:8000`.

---

## Deployment Checklist

### Before Deploying

- [ ] All environment variables configured in Railway
- [ ] All environment variables configured in Vercel
- [ ] Database migrations applied
- [ ] CORS origins include production frontend URL

### After Deploying

- [ ] Health endpoint responds: `/health`
- [ ] API docs accessible: `/docs`
- [ ] Frontend loads without console errors
- [ ] Login/authentication works
- [ ] API calls succeed (check Network tab)

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| 502 Bad Gateway | Port mismatch | Match Railway networking port to app port |
| CORS error | Missing origin | Add frontend URL to `CORS_ORIGINS` |
| "Application failed to respond" | App crashed | Check deploy logs for errors |
| Login fails silently | Wrong API URL | Verify `VITE_API_URL` in Vercel |
| Database connection error | Wrong connection string | Use pooler URL from Supabase |

---

*Last updated: January 2026*
