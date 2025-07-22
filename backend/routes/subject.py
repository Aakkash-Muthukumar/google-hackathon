from fastapi import APIRouter, HTTPException
from backend.services.subject_service import get_subject_data

router = APIRouter(prefix="/subject")

@router.get("/{subject}/{data_type}")
def get_data(subject: str, data_type: str):
    try:
        data = get_subject_data(subject, data_type)
        return data
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e)) 