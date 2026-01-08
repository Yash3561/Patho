# 🔬 PathoAI - Revenue Recovery Engine

<div align="center">

![PathoAI Banner](https://img.shields.io/badge/PathoAI-Revenue%20Recovery%20Engine-emerald?style=for-the-badge&logo=microscope)

**AI-Powered Pathology Billing Optimization for 2026 CMS Compliance**

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-1.5%20Flash-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

[Demo](#demo) • [Features](#features) • [Quick Start](#quick-start) • [Deployment](#deployment) • [API Docs](#api-documentation)

</div>

---

## 🎯 Overview

PathoAI is an enterprise-grade pathology billing optimization platform that uses **Google Gemini AI** to analyze histopathology slides and recommend appropriate CPT code upgrades. Built for 2026 CMS Human-in-the-Loop compliance requirements.

### Key Benefits
- 💰 **Revenue Recovery**: Identify missed billing opportunities
- ✅ **Audit-Ready**: Generate CMS-compliant documentation
- 🤖 **AI-Powered**: Gemini 1.5 Flash for intelligent analysis  
- 🔒 **Human-in-the-Loop**: Pathologist verification workflow
- 📄 **Professional PDFs**: Audit Shield certified reports

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **AI Slide Analysis** | Gemini-powered complexity detection |
| **CPT Code Optimization** | Intelligent upgrade recommendations |
| **Interactive Viewer** | Click to verify annotated regions |
| **Revenue Dashboard** | Real-time analytics and ROI tracking |
| **PDF Export** | Professional audit-ready documentation |
| **Case Management** | Full CRUD with search and filters |
| **Image Upload** | Slide image management |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- pnpm (`npm install -g pnpm`)
- Google Gemini API Key

### 1. Clone & Install

```bash
git clone https://github.com/your-username/patho.git
cd patho

# Frontend dependencies
pnpm install

# Backend dependencies
cd backend
pip install -r requirements.txt
```

### 2. Environment Setup

Create `.env` in root:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Create `backend/.env`:
```env
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Run Locally

```bash
# Terminal 1 - Backend
cd backend
python -m uvicorn main:app --reload --port 8000

# Terminal 2 - Frontend
pnpm dev
```

Visit `http://localhost:3000` 🎉

---

## 🌐 Deployment

### Option 1: Railway (Backend) + Vercel (Frontend) ⭐ Recommended

#### Deploy Backend to Railway

1. **Create Railway Account**: [railway.app](https://railway.app)
2. **Create New Project** → "Deploy from GitHub repo"
3. **Select this repository**
4. **Configure**:
   - Root Directory: `backend`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. **Add Environment Variables**:
   - `GEMINI_API_KEY`: Your Gemini API key
6. **Deploy** → Copy your Railway URL (e.g., `https://patho-backend.railway.app`)

#### Deploy Frontend to Vercel

1. **Create Vercel Account**: [vercel.com](https://vercel.com)
2. **Import** → Select GitHub repository
3. **Configure**:
   - Framework: Next.js
   - Root Directory: `.` (root)
4. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: Your Railway backend URL
5. **Deploy**

### Option 2: Render (Full Stack)

#### Backend
1. Go to [render.com](https://render.com) → New Web Service
2. Connect GitHub repo
3. Configure:
   - Root Directory: `backend`
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add `GEMINI_API_KEY` environment variable
5. Deploy

#### Frontend
1. New Static Site → Connect same repo
2. Build: `pnpm build`
3. Publish: `.next`
4. Add `NEXT_PUBLIC_API_URL` environment variable

### Option 3: Docker Compose

```bash
docker-compose up -d
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    volumes:
      - uploads:/app/uploads

  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8000
    depends_on:
      - backend

volumes:
  uploads:
```

---

## 🔧 CI/CD Pipeline

This project includes a GitHub Actions workflow (`.github/workflows/ci-cd.yml`) that:

1. **Tests**: Runs backend tests and frontend type checking
2. **Builds**: Builds production bundles
3. **Deploys**: Auto-deploys to Railway/Vercel on main branch push

### Required Secrets

Add these to your GitHub repository secrets:

| Secret | Description |
|--------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key |
| `RAILWAY_TOKEN` | Railway API token |
| `VERCEL_TOKEN` | Vercel API token |
| `VERCEL_ORG_ID` | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |

---

## 📚 API Documentation

Once running, access the API docs at:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/cases` | List all cases |
| `POST` | `/api/cases` | Create new case |
| `POST` | `/api/analyze` | AI analysis |
| `POST` | `/api/document` | Verify findings |
| `GET` | `/api/export-pdf` | Generate PDF |
| `GET` | `/api/revenue-summary` | Analytics |

---

## 🏗️ Project Structure

```
patho/
├── app/                    # Next.js frontend
│   ├── page.tsx           # Main dashboard
│   └── layout.tsx         # App layout
├── backend/
│   ├── main.py            # FastAPI application
│   ├── models.py          # SQLAlchemy models
│   ├── services/
│   │   ├── billing_agent.py    # Gemini AI integration
│   │   ├── pdf_generator.py    # ReportLab PDF gen
│   │   └── db_service.py       # Database operations
│   ├── requirements.txt   # Python dependencies
│   └── Dockerfile         # Container config
├── lib/
│   └── api.ts             # Frontend API client
├── components/ui/         # shadcn/ui components
├── .github/workflows/     # CI/CD pipeline
├── vercel.json            # Vercel config
└── railway.json           # Railway config
```

---

## 🔐 Environment Variables

### Frontend (.env)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (backend/.env)
```env
GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL=sqlite:///./pathoai.db
```

---

## 📄 License

MIT License - feel free to use for your projects!

---

## 🙏 Acknowledgments

- **Google Gemini AI** - Powering intelligent analysis
- **shadcn/ui** - Beautiful component library
- **FastAPI** - High-performance Python API
- **ReportLab** - Professional PDF generation

---

<div align="center">

**Built with ❤️ for the Microsoft Summit 2026**

[⬆ Back to Top](#-pathoai---revenue-recovery-engine)

</div>
