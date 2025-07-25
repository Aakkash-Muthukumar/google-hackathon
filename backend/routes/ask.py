from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from backend.services.ai_service import ask_gemma

router = APIRouter()

class AskRequest(BaseModel):
    prompt: str

@router.post("/ask")
async def ask(request: AskRequest):
    if not request.prompt:
        raise HTTPException(status_code=400, detail="No prompt provided.")
    def event_stream():
        for chunk in ask_gemma(request.prompt):
            yield chunk
    return StreamingResponse(event_stream(), media_type="text/plain") 