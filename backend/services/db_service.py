"""
PathoAI Database Service
CRUD operations for case management and revenue tracking.
"""

from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import Optional, List
import json
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import PathologyCase, RevenueSummary, AuditEvent, get_db, SessionLocal


class CaseService:
    """
    Service layer for PathologyCase CRUD operations.
    """
    
    @staticmethod
    def create_case(
        db: Session,
        patient_id: str,
        slide_id: str,
        patient_name: str = None,
        diagnosis: str = None,
        image_url: str = None
    ) -> PathologyCase:
        """Create a new pending case."""
        case = PathologyCase(
            patient_id=patient_id,
            slide_id=slide_id,
            patient_name=patient_name or f"Patient {patient_id}",
            diagnosis=diagnosis or "Pending Analysis",
            image_url=image_url,
            status="PENDING",
            audit_log=[{
                "action": "CREATED",
                "timestamp": datetime.utcnow().isoformat(),
                "details": "Case created for analysis"
            }]
        )
        db.add(case)
        db.commit()
        db.refresh(case)
        return case
    
    @staticmethod
    def get_case_by_slide_id(db: Session, slide_id: str) -> Optional[PathologyCase]:
        """Get case by slide ID."""
        return db.query(PathologyCase).filter(PathologyCase.slide_id == slide_id).first()
    
    @staticmethod
    def get_case_by_id(db: Session, case_id: int) -> Optional[PathologyCase]:
        """Get case by primary key."""
        return db.query(PathologyCase).filter(PathologyCase.id == case_id).first()
    
    @staticmethod
    def get_all_cases(db: Session, status: str = None) -> List[PathologyCase]:
        """Get all cases, optionally filtered by status."""
        query = db.query(PathologyCase)
        if status:
            query = query.filter(PathologyCase.status == status)
        return query.order_by(PathologyCase.created_at.desc()).all()
    
    @staticmethod
    def update_with_analysis(
        db: Session,
        case: PathologyCase,
        analysis_data: dict
    ) -> PathologyCase:
        """Update case with AI analysis results."""
        case.finding_type = analysis_data.get("finding_type", case.diagnosis)
        case.confidence_score = analysis_data.get("confidence_score", 0.0)
        case.complexity_indicators = analysis_data.get("complexity_indicators", [])
        
        # Revenue data
        case.base_cpt_code = analysis_data.get("base_cpt", "88305")
        case.suggested_cpt_code = analysis_data.get("recommended_cpt", "88305")
        case.ai_assisted_code = analysis_data.get("ai_assisted_code", "0596T")
        case.ancillary_codes = analysis_data.get("ancillary_codes", [])
        
        # Money calculations
        case.base_reimbursement = analysis_data.get("base_reimbursement", 72.00)
        case.optimized_reimbursement = analysis_data.get("optimized_reimbursement", 72.00)
        case.recovery_value = analysis_data.get("revenue_delta", 0.0)
        
        # Audit data
        case.justification_text = analysis_data.get("audit_narrative", "")
        case.audit_defense_score = analysis_data.get("audit_defense_score", 0)
        
        # Annotated regions for interactive viewer
        case.annotated_regions = analysis_data.get("annotated_regions", [])
        
        case.status = "ANALYZED"
        
        # Audit log
        if case.audit_log is None:
            case.audit_log = []
        case.audit_log.append({
            "action": "ANALYZED",
            "timestamp": datetime.utcnow().isoformat(),
            "details": f"AI analysis complete. Confidence: {case.confidence_score:.2%}"
        })
        
        db.commit()
        db.refresh(case)
        return case
    
    @staticmethod
    def verify_case(
        db: Session,
        case: PathologyCase,
        pathologist_name: str,
        clicked_indicators: List[str] = None
    ) -> PathologyCase:
        """Mark case as verified by pathologist."""
        case.status = "VERIFIED"
        case.verified_by = pathologist_name
        case.verified_at = datetime.utcnow()
        
        # Audit log
        if case.audit_log is None:
            case.audit_log = []
        case.audit_log.append({
            "action": "VERIFIED",
            "timestamp": datetime.utcnow().isoformat(),
            "user": pathologist_name,
            "details": f"Verified with {len(clicked_indicators or [])} complexity indicators confirmed"
        })
        
        db.commit()
        db.refresh(case)
        
        # Update revenue summary
        RevenueService.update_summary(db, case)
        
        return case
    
    @staticmethod
    def mark_exported(db: Session, case: PathologyCase) -> PathologyCase:
        """Mark case as exported (PDF generated)."""
        case.status = "EXPORTED"
        case.exported_at = datetime.utcnow()
        
        if case.audit_log is None:
            case.audit_log = []
        case.audit_log.append({
            "action": "EXPORTED",
            "timestamp": datetime.utcnow().isoformat(),
            "details": "Audit Shield PDF generated"
        })
        
        db.commit()
        db.refresh(case)
        return case
    
    @staticmethod
    def log_region_click(
        db: Session,
        case: PathologyCase,
        region_label: str,
        user: str = "pathologist"
    ) -> None:
        """Log when a user clicks a region in the interactive viewer."""
        if case.audit_log is None:
            case.audit_log = []
        case.audit_log.append({
            "action": "REGION_CLICKED",
            "timestamp": datetime.utcnow().isoformat(),
            "user": user,
            "details": f"Examined region: {region_label}"
        })
        db.commit()
        
        # Also log to audit events table
        event = AuditEvent(
            case_id=case.id,
            event_type="REGION_CLICKED",
            event_data={"region": region_label},
            user_id=user
        )
        db.add(event)
        db.commit()


class RevenueService:
    """
    Service for revenue tracking and analytics.
    """
    
    @staticmethod
    def get_summary(db: Session) -> dict:
        """Get current revenue summary metrics."""
        cases = db.query(PathologyCase).filter(
            PathologyCase.status.in_(["VERIFIED", "EXPORTED"])
        ).all()
        
        if not cases:
            return {
                "total_cases_processed": 0,
                "total_revenue_recovered": 0.0,
                "average_recovery_per_case": 0.0,
                "average_audit_score": 0.0,
                "cases_audit_ready": 0,
                "efficiency_gain_hours": 0.0,
                "cpt_breakdown": {}
            }
        
        total_recovered = sum(c.recovery_value or 0 for c in cases)
        avg_recovery = total_recovered / len(cases) if cases else 0
        avg_audit = sum(c.audit_defense_score or 0 for c in cases) / len(cases)
        audit_ready = len([c for c in cases if (c.audit_defense_score or 0) >= 90])
        
        # CPT breakdown
        cpt_breakdown = {}
        for case in cases:
            if case.base_cpt_code and case.suggested_cpt_code:
                key = f"{case.base_cpt_code}→{case.suggested_cpt_code}"
                cpt_breakdown[key] = cpt_breakdown.get(key, 0) + 1
        
        # Efficiency: assume 8 minutes saved per case vs 15 min national average
        efficiency_hours = (len(cases) * 8) / 60
        
        return {
            "total_cases_processed": len(cases),
            "total_revenue_recovered": round(total_recovered, 2),
            "average_recovery_per_case": round(avg_recovery, 2),
            "average_audit_score": round(avg_audit, 1),
            "cases_audit_ready": audit_ready,
            "efficiency_gain_hours": round(efficiency_hours, 1),
            "cpt_breakdown": cpt_breakdown
        }
    
    @staticmethod
    def update_summary(db: Session, case: PathologyCase) -> None:
        """Update revenue summary after case verification."""
        # Get or create today's summary
        today = datetime.utcnow().date()
        summary = db.query(RevenueSummary).filter(
            func.date(RevenueSummary.date) == today
        ).first()
        
        if not summary:
            summary = RevenueSummary(
                date=datetime.utcnow(),
                total_cases_processed=0,
                total_revenue_recovered=0.0,
                average_recovery_per_case=0.0,
                average_audit_score=0.0,
                cases_audit_ready=0
            )
            db.add(summary)
            db.flush()  # Ensure defaults are set
        
        # Ensure values are not None before incrementing
        if summary.total_cases_processed is None:
            summary.total_cases_processed = 0
        if summary.total_revenue_recovered is None:
            summary.total_revenue_recovered = 0.0
        if summary.cases_audit_ready is None:
            summary.cases_audit_ready = 0
        
        # Update metrics
        summary.total_cases_processed += 1
        summary.total_revenue_recovered += (case.recovery_value or 0)
        summary.average_recovery_per_case = (
            summary.total_revenue_recovered / summary.total_cases_processed
        )
        
        if case.audit_defense_score and case.audit_defense_score >= 90:
            summary.cases_audit_ready += 1
        
        db.commit()


# Seed initial data for demo
def seed_demo_data():
    """Populate database with demo cases for presentation."""
    db = SessionLocal()
    
    # Check if already seeded
    if db.query(PathologyCase).count() > 0:
        db.close()
        return
    
    demo_cases = [
        {
            "patient_id": "PT-8829",
            "slide_id": "WSI-2024-1847",
            "patient_name": "Jane Doe",
            "diagnosis": "Invasive Ductal Carcinoma",
            "image_url": "/microscopic-tissue-sample-histopathology-cells-pin.jpg",
            "status": "PENDING"
        },
        {
            "patient_id": "PT-7721",
            "slide_id": "WSI-2024-1846",
            "patient_name": "John Smith",
            "diagnosis": "Melanoma In Situ",
            "image_url": "/microscopic-tissue-sample-histopathology-cells-pin.jpg",
            "status": "PENDING"
        },
        {
            "patient_id": "PT-9923",
            "slide_id": "WSI-2024-1845",
            "patient_name": "Robert Johnson",
            "diagnosis": "Squamous Cell Carcinoma",
            "image_url": "/microscopic-tissue-sample-histopathology-cells-pin.jpg",
            "status": "PENDING"
        },
        {
            "patient_id": "PT-5512",
            "slide_id": "WSI-2024-1844",
            "patient_name": "Maria Garcia",
            "diagnosis": "Prostate Adenocarcinoma",
            "image_url": "/microscopic-tissue-sample-histopathology-cells-pin.jpg",
            "status": "PENDING"
        },
        {
            "patient_id": "PT-3348",
            "slide_id": "WSI-2024-1843",
            "patient_name": "William Brown",
            "diagnosis": "Thyroid Papillary Carcinoma",
            "image_url": "/microscopic-tissue-sample-histopathology-cells-pin.jpg",
            "status": "PENDING"
        }
    ]
    
    for case_data in demo_cases:
        case = PathologyCase(**case_data, audit_log=[{
            "action": "CREATED",
            "timestamp": datetime.utcnow().isoformat(),
            "details": "Demo case seeded"
        }])
        db.add(case)
    
    db.commit()
    db.close()
    print(f"[OK] Seeded {len(demo_cases)} demo cases")
