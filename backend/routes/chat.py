from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
from services.chat_service import (
    get_all_chats, get_chat_by_id, create_chat, update_chat, delete_chat
)

router = APIRouter(prefix="/chat")

class ChatMessage(BaseModel):
    id: str
    content: str
    sender: str  # "user" or "tutor"
    timestamp: str
    threadId: Optional[str] = None

class ChatSession(BaseModel):
    id: str
    name: str
    messages: List[ChatMessage]
    createdAt: str
    updatedAt: str

class CreateChatRequest(BaseModel):
    id: str
    name: str
    messages: Optional[List[ChatMessage]] = []

class UpdateChatRequest(BaseModel):
    name: Optional[str] = None
    messages: Optional[List[Dict[str, Any]]] = None

@router.get("/")
def get_chats():
    """Get all chat sessions"""
    try:
        return get_all_chats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get chats: {str(e)}")

@router.get("/{chat_id}")
def get_chat(chat_id: str):
    """Get a specific chat session by ID"""
    try:
        chat = get_chat_by_id(chat_id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        return chat
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get chat: {str(e)}")

@router.post("/")
def create_new_chat(chat_request: CreateChatRequest):
    """Create a new chat session"""
    try:
        chat_data = {
            'id': chat_request.id,
            'name': chat_request.name,
            'messages': [msg.dict() for msg in chat_request.messages] if chat_request.messages else []
        }
        return create_chat(chat_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create chat: {str(e)}")

@router.put("/{chat_id}")
def update_existing_chat(chat_id: str, chat_request: UpdateChatRequest):
    """Update an existing chat session"""
    try:
        chat_data = {}
        if chat_request.name is not None:
            chat_data['name'] = chat_request.name
        if chat_request.messages is not None:
            chat_data['messages'] = chat_request.messages
        
        updated_chat = update_chat(chat_id, chat_data)
        if not updated_chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        return updated_chat
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update chat: {str(e)}")

@router.delete("/{chat_id}")
def delete_existing_chat(chat_id: str):
    """Delete a chat session"""
    try:
        success = delete_chat(chat_id)
        if not success:
            raise HTTPException(status_code=404, detail="Chat not found")
        return {"detail": "Chat deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete chat: {str(e)}")

@router.post("/bulk")
def save_all_chats(chats: List[Dict[str, Any]]):
    """Save all chat sessions (bulk operation for migration)"""
    try:
        from services.chat_service import save_chats
        success = save_chats(chats)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to save chats")
        return {"detail": "All chats saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save chats: {str(e)}")

# Additional endpoint for storing current chat ID
@router.post("/current/{chat_id}")
def set_current_chat(chat_id: str):
    """Set the current active chat ID (stored in memory for this session)"""
    # For now, we'll just return success. In a real app, you might want to store this in a session or user preferences
    return {"detail": f"Current chat set to {chat_id}"}

@router.get("/current/id")
def get_current_chat():
    """Get the current active chat ID"""
    # For now, just return null. In a real app, you'd retrieve from session/user preferences
    return {"currentChatId": None}