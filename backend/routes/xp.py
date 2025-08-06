from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from pydantic import BaseModel
from services.xp_service import (
    award_xp_for_flashcard,
    deduct_xp_for_flashcard,
    award_xp_for_lesson_completion,
    award_xp_for_course_completion,
    get_user_progress
)

router = APIRouter(prefix="/xp", tags=["xp"])

# Data models
class FlashcardXPRequest(BaseModel):
    user_id: str = "default_user"
    flashcard_id: int
    xp_amount: int = 10

class FlashcardDeductRequest(BaseModel):
    user_id: str = "default_user"
    flashcard_id: int
    xp_amount: int = 10

class LessonXPRequest(BaseModel):
    user_id: str = "default_user"
    course_id: str
    lesson_id: str
    xp_amount: int

class CourseXPRequest(BaseModel):
    user_id: str = "default_user"
    course_id: str
    xp_amount: int

class ProgressRequest(BaseModel):
    user_id: str = "default_user"

@router.post("/flashcard")
def award_flashcard_xp(request: FlashcardXPRequest) -> Dict[str, Any]:
    """Award XP for learning a flashcard"""
    try:
        result = award_xp_for_flashcard(request.user_id, request.flashcard_id, request.xp_amount)
        return {
            "success": True,
            "xp_earned": result['total_xp_earned'],
            "new_achievements": result['new_achievements'],
            "achievement_xp_earned": result['achievement_xp_earned'],
            "user_progress": result['progress']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to award flashcard XP: {str(e)}")

@router.post("/flashcard/deduct")
def deduct_flashcard_xp(request: FlashcardDeductRequest) -> Dict[str, Any]:
    """Deduct XP for forgetting a flashcard"""
    try:
        result = deduct_xp_for_flashcard(request.user_id, request.flashcard_id, request.xp_amount)
        return {
            "success": True,
            "xp_earned": result['total_xp_earned'],
            "new_achievements": result['new_achievements'],
            "achievement_xp_earned": result['achievement_xp_earned'],
            "user_progress": result['progress']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to deduct flashcard XP: {str(e)}")

@router.post("/lesson")
def award_lesson_xp(request: LessonXPRequest) -> Dict[str, Any]:
    """Award XP for completing a lesson"""
    try:
        result = award_xp_for_lesson_completion(request.user_id, request.course_id, request.lesson_id, request.xp_amount)
        return {
            "success": True,
            "xp_earned": result['total_xp_earned'],
            "new_achievements": result['new_achievements'],
            "achievement_xp_earned": result['achievement_xp_earned'],
            "user_progress": result['progress']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to award lesson XP: {str(e)}")

@router.post("/course")
def award_course_xp(request: CourseXPRequest) -> Dict[str, Any]:
    """Award XP for completing a course"""
    try:
        result = award_xp_for_course_completion(request.user_id, request.course_id, request.xp_amount)
        return {
            "success": True,
            "xp_earned": result['total_xp_earned'],
            "new_achievements": result['new_achievements'],
            "achievement_xp_earned": result['achievement_xp_earned'],
            "user_progress": result['progress']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to award course XP: {str(e)}")

@router.post("/progress")
def get_user_progress_endpoint(request: ProgressRequest) -> Dict[str, Any]:
    """Get user progress with updated streak"""
    try:
        progress = get_user_progress(request.user_id)
        return {
            "success": True,
            "progress": progress
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user progress: {str(e)}") 