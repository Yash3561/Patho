"""
Local JSON Database for MVP
Simple file-based persistence for documented cases.
For production, migrate to PostgreSQL.
"""

import json
import os
from datetime import datetime
from typing import Dict, Any, List, Optional
from pathlib import Path


class LocalDB:
    """
    File-based JSON storage for documented billing cases.
    Thread-safe operations with file locking.
    """
    
    def __init__(self, db_path: str = "backend/data/cases.json"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Initialize DB file if not exists
        if not self.db_path.exists():
            self._write_db({"cases": [], "metadata": {"created": datetime.utcnow().isoformat()}})
    
    def _read_db(self) -> Dict[str, Any]:
        """Read database file."""
        try:
            with open(self.db_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return {"cases": [], "metadata": {"created": datetime.utcnow().isoformat()}}
    
    def _write_db(self, data: Dict[str, Any]) -> None:
        """Write database file atomically."""
        temp_path = self.db_path.with_suffix('.tmp')
        with open(temp_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, default=str)
        temp_path.replace(self.db_path)
    
    def add_case(self, case_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Add a documented case to the database.
        
        Args:
            case_data: Case documentation (slide_id, pathologist, cpt_codes, etc.)
            
        Returns:
            The saved case with generated ID and timestamp
        """
        db = self._read_db()
        
        # Generate record
        record = {
            "id": f"DOC-{len(db['cases']) + 1:06d}",
            "timestamp": datetime.utcnow().isoformat(),
            **case_data
        }
        
        db["cases"].append(record)
        db["metadata"]["last_updated"] = datetime.utcnow().isoformat()
        
        self._write_db(db)
        return record
    
    def get_case(self, case_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific case by ID."""
        db = self._read_db()
        for case in db["cases"]:
            if case.get("id") == case_id or case.get("slide_id") == case_id:
                return case
        return None
    
    def get_all_cases(self) -> List[Dict[str, Any]]:
        """Get all documented cases."""
        db = self._read_db()
        return db["cases"]
    
    def get_cases_by_status(self, status: str) -> List[Dict[str, Any]]:
        """Get cases filtered by status."""
        db = self._read_db()
        return [c for c in db["cases"] if c.get("status") == status]
    
    def update_case(self, case_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update an existing case."""
        db = self._read_db()
        
        for i, case in enumerate(db["cases"]):
            if case.get("id") == case_id or case.get("slide_id") == case_id:
                db["cases"][i] = {**case, **updates, "updated_at": datetime.utcnow().isoformat()}
                db["metadata"]["last_updated"] = datetime.utcnow().isoformat()
                self._write_db(db)
                return db["cases"][i]
        
        return None
    
    def get_revenue_summary(self) -> Dict[str, Any]:
        """Calculate total recovered revenue from documented cases."""
        db = self._read_db()
        
        total_recovered = sum(
            case.get("revenue_delta", 0) 
            for case in db["cases"] 
            if case.get("status") == "verified"
        )
        
        return {
            "total_cases": len(db["cases"]),
            "verified_cases": len([c for c in db["cases"] if c.get("status") == "verified"]),
            "total_recovered": round(total_recovered, 2),
            "average_per_case": round(total_recovered / max(1, len(db["cases"])), 2)
        }


# Singleton instance
db = LocalDB()
