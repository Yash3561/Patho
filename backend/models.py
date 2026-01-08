"""
PathoAI Database Models
SQLAlchemy ORM for SQLite persistence

Standard 2026 Startup Schema
"""

from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./patho.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class PathologyCase(Base):
    """
    Core case model for revenue recovery tracking.
    
    Status Flow: PENDING → ANALYZED → VERIFIED → EXPORTED
    """
    __tablename__ = "cases"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String(50), unique=True, index=True)
    patient_name = Column(String(100))
    
    # Case metadata
    slide_id = Column(String(50), unique=True, index=True)
    image_url = Column(String(500))  # Path to slide image
    diagnosis = Column(String(200))  # e.g., "Invasive Ductal Carcinoma"
    status = Column(String(20), default="PENDING")  # PENDING, ANALYZED, VERIFIED, EXPORTED
    
    # AI Findings
    finding_type = Column(String(200))  # Detailed finding type
    confidence_score = Column(Float, default=0.0)
    complexity_indicators = Column(JSON)  # List of complexity factors
    
    # Revenue Recovery (The Shark Logic)
    base_cpt_code = Column(String(20), default="88305")
    suggested_cpt_code = Column(String(50))  # e.g., "88309 + 0596T"
    ai_assisted_code = Column(String(20))  # 0596T-0763T range
    ancillary_codes = Column(JSON)  # Additional billable codes
    
    # The Money
    base_reimbursement = Column(Float, default=72.00)  # Status quo
    optimized_reimbursement = Column(Float)  # After PathoAI
    recovery_value = Column(Float)  # The +$18.40 profit delta
    
    # Audit Proof
    justification_text = Column(Text)  # 3-sentence CMS narrative
    audit_defense_score = Column(Integer, default=0)  # 0-100
    
    # Clickable regions for interactive viewer
    # Format: [{"x": 100, "y": 200, "width": 50, "height": 50, "label": "High-grade nuclei", "cpt_impact": "+$8.20"}]
    annotated_regions = Column(JSON)
    
    # Audit trail
    verified_by = Column(String(100))  # Pathologist name
    verified_at = Column(DateTime)
    exported_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Full audit log
    audit_log = Column(JSON)  # [{action, timestamp, user, details}]


class RevenueSummary(Base):
    """
    Aggregated revenue metrics for the Money View dashboard.
    Updated on each case verification.
    """
    __tablename__ = "revenue_summary"
    
    id = Column(Integer, primary_key=True)
    date = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Cumulative metrics
    total_cases_processed = Column(Integer, default=0)
    total_revenue_recovered = Column(Float, default=0.0)
    average_recovery_per_case = Column(Float, default=0.0)
    
    # Audit readiness
    average_audit_score = Column(Float, default=0.0)
    cases_audit_ready = Column(Integer, default=0)  # Score >= 90
    
    # Efficiency
    average_time_saved_seconds = Column(Float, default=0.0)  # vs national average
    
    # By CPT breakdown
    cpt_upgrade_breakdown = Column(JSON)  # {"88305→88307": 5, "88305→88309": 12}


class AuditEvent(Base):
    """
    Immutable audit trail for compliance.
    """
    __tablename__ = "audit_events"
    
    id = Column(Integer, primary_key=True)
    case_id = Column(Integer, index=True)
    event_type = Column(String(50))  # CREATED, ANALYZED, REGION_CLICKED, VERIFIED, EXPORTED
    event_data = Column(JSON)
    user_id = Column(String(100))
    ip_address = Column(String(50))
    timestamp = Column(DateTime, default=datetime.utcnow)


# Database initialization
def init_db():
    """Create all tables."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Dependency for FastAPI routes."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Initialize on import
init_db()
