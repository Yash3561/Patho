# PathoAI Backend API

FastAPI backend for PathoAI Revenue Recovery Engine.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Add your Gemini API key to `.env`:
```
GEMINI_API_KEY="your_actual_key_here"
```

4. Run the server:
```bash
uvicorn main:app --reload --port 8000
```

## API Endpoints

### POST `/api/analyze`
Analyze slide using Gemini 3 Pro to extract 2026 CPT codes and audit justification.

**Request:**
```json
{
  "slide_id": "WSI-2024-1847",
  "image_path": "optional/path/to/image",
  "findings": {}
}
```

**Response:**
```json
{
  "slide_id": "WSI-2024-1847",
  "base_cpt": "88305",
  "recommended_cpt": "88309",
  "revenue_delta": 18.40,
  "cpt_codes": {
    "base": "88305",
    "recommended": "88309",
    "ai_assisted": "0596T",
    "ancillary": ["88342"]
  },
  "audit_narrative": "...",
  "complexity_indicators": [...],
  "confidence_score": 0.94,
  "audit_defense_score": 96,
  "model_used": "gemini-3-pro-latest"
}
```

### POST `/api/document`
Record pathologist's confirmation.

**Request:**
```json
{
  "slide_id": "WSI-2024-1847",
  "pathologist_name": "Dr. [Name]",
  "verified_cpt_codes": ["88309"],
  "complexity_indicators_clicked": ["High nuclear grade..."]
}
```

### GET `/api/export-pdf`
Generate and download Audit Shield PDF report.

**Query Params:**
- `slide_id`: Slide identifier

**Response:** PDF file download

### GET `/api/cases`
Retrieve all documented cases from the local database.

**Response:**
```json
[
  {
    "id": "DOC-000001",
    "slide_id": "WSI-2024-1847",
    "pathologist_name": "Dr. [Name]",
    "status": "verified",
    "timestamp": "2026-01-04T12:00:00",
    "revenue_delta": 18.40
  }
]
```

### GET `/api/cases/{slide_id}`
Retrieve a specific case by slide ID.

### GET `/api/revenue-summary`
Get aggregated revenue recovery statistics.

**Response:**
```json
{
  "total_cases": 47,
  "verified_cases": 42,
  "total_recovered": 847.90,
  "average_per_case": 20.19
}
```

## Models

- **Primary:** Gemini 3 Pro (`gemini-3-pro-latest`) for complex billing-regulatory reasoning
- **Secondary:** Gemini 3 Flash (`gemini-3-flash-latest`) for fast UI interactions (future use)

## Data Persistence

For the MVP, documented cases are stored in `backend/data/cases.json`. 
For production, migrate to PostgreSQL.
