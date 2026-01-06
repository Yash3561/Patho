# 🔬 PathoAI Revenue Recovery Engine

> AI-powered pathology billing optimization using Gemini to identify under-documented cases and recover revenue.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?logo=fastapi)
![Gemini](https://img.shields.io/badge/Gemini-2.0_Flash-4285F4?logo=google)
![License](https://img.shields.io/badge/License-MIT-green)

## 🎯 Problem

Pathology labs lose **$2.3M annually** due to under-coded specimens. Complex cases often get billed as simple 88305s when they warrant higher-reimbursement codes (88307, 88309).

## 💡 Solution

PathoAI analyzes pathology findings and:
- **Maps findings to 2026 CPT codes** (including AI-assisted codes 0596T-0763T)
- **Calculates revenue delta** between current and recommended billing
- **Generates audit-ready documentation** with CMS-compliant justifications
- **Creates Audit Shield PDFs** for insurance defense

## 🖥️ Screenshots

*Coming soon*

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15, React 19, shadcn/ui, Tailwind CSS |
| **Backend** | FastAPI, Python 3.12 |
| **AI** | Google Gemini 2.0 Flash |
| **PDF** | ReportLab |
| **Database** | Local JSON (MVP) → PostgreSQL (Production) |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- pnpm (recommended) or npm
- Gemini API Key ([Get one here](https://makersuite.google.com/app/apikey))

### 1. Clone the repo
```bash
git clone https://github.com/Yash3561/Patho.git
cd Patho
```

### 2. Setup Frontend
```bash
pnpm install
```

### 3. Setup Backend
```bash
cd backend
pip install -r requirements.txt
```

### 4. Configure Environment
```bash
# In project root
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### 5. Run Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
pnpm dev
```

### 6. Open the App
Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
patho/
├── app/                    # Next.js app router
│   ├── page.tsx           # Main dashboard
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── backend/
│   ├── main.py            # FastAPI entry point
│   ├── services/
│   │   ├── billing_agent.py   # Gemini AI integration
│   │   ├── pdf_generator.py   # ReportLab PDF creator
│   │   └── local_db.py        # JSON database
│   └── requirements.txt
├── components/
│   └── ui/                # shadcn/ui components
├── lib/
│   └── api.ts             # Frontend API client
├── architecture.md        # Detailed system design
└── README.md
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/analyze` | Analyze slide for billing optimization |
| `POST` | `/api/document` | Save verified case to database |
| `GET` | `/api/export-pdf` | Generate Audit Shield PDF |
| `GET` | `/api/cases` | List all documented cases |
| `GET` | `/api/revenue-summary` | Get revenue recovery metrics |

### Example: Analyze a Slide
```bash
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"slide_id": "WSI-2024-1847"}'
```

## 🎨 Features

- [x] 3-pane dashboard layout
- [x] AI-powered billing analysis
- [x] Complexity indicator verification
- [x] PDF audit report generation
- [x] Demo mode (works without API key)
- [ ] Dynamic case management
- [ ] Revenue analytics dashboard
- [ ] User authentication
- [ ] Slide image upload

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | No (falls back to demo) |
| `NEXT_PUBLIC_API_URL` | Backend URL | No (defaults to localhost:8000) |

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📧 Contact

**Yash** - [@Yash3561](https://github.com/Yash3561)

---

<p align="center">
  Made with ❤️ for pathology labs everywhere
</p>
