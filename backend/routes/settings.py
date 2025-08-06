from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Dict, Any, Optional
from services.export_service import export_all_data, export_user_progress_only, import_data_from_export
from services.reset_service import reset_user_progress, reset_all_users_progress

router = APIRouter(prefix="/settings", tags=["settings"])

class ImportDataRequest(BaseModel):
    export_data: Dict[str, Any]

@router.get("/export")
def export_data(
    user_id: str = Query("default_user", description="User ID"),
    export_type: str = Query("all", description="Export type: 'all' or 'progress_only'")
):
    """Export all learning data."""
    try:
        if export_type == 'progress_only':
            export_data = export_user_progress_only(user_id)
        else:
            export_data = export_all_data(user_id)
        
        return export_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/import")
def import_data(
    request: ImportDataRequest,
    user_id: str = Query("default_user", description="User ID")
):
    """Import data from exported backup."""
    try:
        result = import_data_from_export(request.export_data, user_id)
        
        if result['success']:
            return result
        else:
            raise HTTPException(status_code=400, detail=result['error'])
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reset-progress")
def reset_progress(
    user_id: str = Query("default_user", description="User ID"),
    reset_all: bool = Query(False, description="Reset all users")
):
    """Reset user progress data."""
    try:
        if reset_all:
            result = reset_all_users_progress()
        else:
            result = reset_user_progress(user_id)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user-progress")
def get_user_progress(
    user_id: str = Query("default_user", description="User ID")
):
    """Get current user progress for settings page."""
    try:
        # Import the XP service to get updated progress
        from services.xp_service import get_user_progress as get_progress
        progress = get_progress(user_id)
        
        return {
            'success': True,
            'progress': progress
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 