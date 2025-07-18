from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from backend.services.ai_service import ask_gemma

router = APIRouter()

class AskRequest(BaseModel):
    prompt: str

@router.post("/ask")
async def ask(request: AskRequest):
    if not request.prompt:
        raise HTTPException(status_code=400, detail="No prompt provided.")
    response = ask_gemma(request.prompt)
    return {"response": response} 