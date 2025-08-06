from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Dict
from services.flashcard_service import (
    get_all_flashcards, add_flashcard, update_flashcard, delete_flashcard, mark_flashcard_learned
)

router = APIRouter(prefix="/flashcard")

class FlashcardModel(BaseModel):
    term: str
    definition: str
    language: str
    topic: str
    difficulty: str

class MarkLearnedRequest(BaseModel):
    user_id: str = "default_user"
    flashcard_id: int

@router.get("/")
def get_flashcards():
    return get_all_flashcards()

@router.post("/")
def create_flashcard(flashcard: FlashcardModel):
    return add_flashcard(flashcard.dict())

@router.put("/{flashcard_id}")
def edit_flashcard(flashcard_id: int, flashcard: Dict[str, Any]):
    try:
        return update_flashcard(flashcard_id, flashcard)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/{flashcard_id}")
def remove_flashcard(flashcard_id: int):
    try:
        delete_flashcard(flashcard_id)
        return {"detail": "Deleted"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/mark-learned")
def mark_learned(request: MarkLearnedRequest):
    """Mark a flashcard as learned and update achievement progress."""
    try:
        result = mark_flashcard_learned(request.user_id, request.flashcard_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to mark flashcard as learned: {str(e)}") 