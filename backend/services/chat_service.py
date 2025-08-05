import json
import os
from typing import List, Dict, Any, Optional
from datetime import datetime

# Path to data files
DATA_DIR = os.path.join(os.path.dirname(__file__), '../data')
CHATS_FILE = os.path.join(DATA_DIR, 'chats.json')

def load_chats() -> List[Dict[str, Any]]:
    """Load all chat sessions from JSON file"""
    if not os.path.exists(CHATS_FILE):
        # Create the file with empty list if it doesn't exist
        os.makedirs(DATA_DIR, exist_ok=True)
        with open(CHATS_FILE, 'w') as f:
            json.dump([], f)
        return []
    
    try:
        with open(CHATS_FILE, 'r') as f:
            chats = json.load(f)
            # Convert string dates back to datetime objects for consistency
            for chat in chats:
                if isinstance(chat.get('createdAt'), str):
                    chat['createdAt'] = datetime.fromisoformat(chat['createdAt'].replace('Z', '+00:00'))
                if isinstance(chat.get('updatedAt'), str):
                    chat['updatedAt'] = datetime.fromisoformat(chat['updatedAt'].replace('Z', '+00:00'))
                
                # Convert message timestamps
                for message in chat.get('messages', []):
                    if isinstance(message.get('timestamp'), str):
                        message['timestamp'] = datetime.fromisoformat(message['timestamp'].replace('Z', '+00:00'))
            return chats
    except (FileNotFoundError, json.JSONDecodeError):
        return []

def save_chats(chats: List[Dict[str, Any]]) -> bool:
    """Save all chat sessions to JSON file"""
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        
        # Convert datetime objects to ISO strings for JSON serialization
        chats_serializable = []
        for chat in chats:
            chat_copy = chat.copy()
            if isinstance(chat_copy.get('createdAt'), datetime):
                chat_copy['createdAt'] = chat_copy['createdAt'].isoformat()
            if isinstance(chat_copy.get('updatedAt'), datetime):
                chat_copy['updatedAt'] = chat_copy['updatedAt'].isoformat()
            
            # Convert message timestamps
            messages_serializable = []
            for message in chat_copy.get('messages', []):
                message_copy = message.copy()
                if isinstance(message_copy.get('timestamp'), datetime):
                    message_copy['timestamp'] = message_copy['timestamp'].isoformat()
                messages_serializable.append(message_copy)
            
            chat_copy['messages'] = messages_serializable
            chats_serializable.append(chat_copy)
        
        with open(CHATS_FILE, 'w') as f:
            json.dump(chats_serializable, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving chats: {e}")
        return False

def get_chat_by_id(chat_id: str) -> Optional[Dict[str, Any]]:
    """Get a specific chat session by ID"""
    chats = load_chats()
    for chat in chats:
        if chat.get('id') == chat_id:
            return chat
    return None

def create_chat(chat_data: Dict[str, Any]) -> Dict[str, Any]:
    chats = load_chats()
    
    # Convert message timestamps to datetime objects if they are strings
    messages = []
    for msg in chat_data.get('messages', []):
        msg_copy = msg.copy()
        ts = msg_copy.get('timestamp')
        if isinstance(ts, str):
            msg_copy['timestamp'] = datetime.fromisoformat(ts.replace('Z', '+00:00'))
        messages.append(msg_copy)
    
    new_chat = {
        'id': chat_data.get('id'),
        'name': chat_data.get('name', 'New Chat'),
        'messages': messages,
        'createdAt': datetime.now(),
        'updatedAt': datetime.now()
    }

    chats.append(new_chat)
    save_chats(chats)
    return new_chat

def update_chat(chat_id: str, chat_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Update an existing chat session"""
    chats = load_chats()
    
    for i, chat in enumerate(chats):
        if chat.get('id') == chat_id:
            # Update fields
            chats[i].update({
                'name': chat_data.get('name', chat['name']),
                'messages': chat_data.get('messages', chat['messages']),
                'updatedAt': datetime.now()
            })
            save_chats(chats)
            return chats[i]
    
    return None

def delete_chat(chat_id: str) -> bool:
    """Delete a chat session"""
    chats = load_chats()
    initial_count = len(chats)
    
    chats = [chat for chat in chats if chat.get('id') != chat_id]
    
    if len(chats) < initial_count:
        save_chats(chats)
        return True
    return False

def get_all_chats() -> List[Dict[str, Any]]:
    """Get all chat sessions"""
    return load_chats()