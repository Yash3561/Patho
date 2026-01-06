"""
PathoAI FastAPI Backend
Enterprise Revenue Recovery Engine for 2026 CMS Compliance
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import os
from dotenv import load_dotenv

from services.billing_agent import BillingAgent
from services.pdf_generator import PDFGenerator
from services.local_db import db

# Load environment variables
load_dotenv()

app = FastAPI(
    title="PathoAI Revenue Recovery API",
    description="2026 CMS Compliance & Billing Automation",
    version="1.0.0"
)

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
billing_agent = BillingAgent()
pdf_generator = PDFGenerator()


class AnalyzeRequest(BaseModel):
    slide_id: str
    image_path: Optional[str] = None
    findings: Optional[Dict[str, Any]] = None


class DocumentRequest(BaseModel):
    slide_id: str
    pathologist_name: str
    verified_cpt_codes: List[str]
    complexity_indicators_clicked: List[str]
    billing_data: Optional[Dict[str, Any]] = None


@app.get("/")
async def root():
    return {
        "service": "PathoAI Revenue Recovery API",
        "version": "1.0.0",
        "status": "operational"
    }


@app.post("/api/analyze")
async def analyze_slide(request: AnalyzeRequest):
    """
    Analyze slide using Gemini 3 Pro to extract 2026 CPT codes and audit justification.
    Returns JSON mapping findings to revenue delta.
    """
    try:
        result = await billing_agent.analyze(
            slide_id=request.slide_id,
            image_path=request.image_path,
            findings=request.findings
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/api/document")
async def document_verification(request: DocumentRequest):
    """
    Record pathologist's confirmation click event.
    Generates timestamped record in local DB.
    """
    try:
        # Create case record with verified status
        case_data = {
            "slide_id": request.slide_id,
            "pathologist_name": request.pathologist_name,
            "verified_cpt_codes": request.verified_cpt_codes,
            "complexity_indicators": request.complexity_indicators_clicked,
            "billing_data": request.billing_data,
            "status": "verified",
            "revenue_delta": request.billing_data.get("revenue_delta", 0) if request.billing_data else 0
        }
        
        # Save to local database
        record = db.add_case(case_data)
        
        return {
            "status": "documented",
            "record": record
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Documentation failed: {str(e)}")


@app.get("/api/cases")
async def get_cases():
    """
    Retrieve all documented cases from the local database.
    """
    try:
        cases = db.get_all_cases()
        return cases
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch cases: {str(e)}")


@app.get("/api/cases/{slide_id}")
async def get_case(slide_id: str):
    """
    Retrieve a specific case by slide ID.
    """
    try:
        case = db.get_case(slide_id)
        if not case:
            raise HTTPException(status_code=404, detail="Case not found")
        return case
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch case: {str(e)}")


@app.get("/api/revenue-summary")
async def get_revenue_summary():
    """
    Get aggregated revenue recovery statistics.
    """
    try:
        summary = db.get_revenue_summary()
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to calculate summary: {str(e)}")


@app.get("/api/export-pdf")
async def export_pdf(slide_id: str):
    """
    Generate the "Audit Shield" PDF using ReportLab.
    Returns the PDF file for download.
    """
    try:
        # Get case data from database if it exists
        case = db.get_case(slide_id)
        billing_data = case.get("billing_data") if case else None
        pathologist_name = case.get("pathologist_name", "Dr. [Reviewing Pathologist]") if case else "Dr. [Reviewing Pathologist]"
        
        pdf_path = await pdf_generator.generate_audit_report(
            slide_id=slide_id,
            billing_data=billing_data,
            pathologist_name=pathologist_name
        )
        
        # Return the file for download
        return FileResponse(
            path=pdf_path,
            media_type='application/pdf',
            filename=f'audit_shield_{slide_id}.pdf',
            headers={
                "Content-Disposition": f'attachment; filename="audit_shield_{slide_id}.pdf"'
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
