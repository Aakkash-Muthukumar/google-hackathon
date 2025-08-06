import json
from typing import Dict, Any, List
from datetime import datetime
import os

def load_progress() -> Dict[str, Any]:
    """Load user progress from JSON file."""
    try:
        with open('data/progress.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

def load_flashcards() -> List[Dict[str, Any]]:
    """Load flashcards from JSON file."""
    try:
        with open('data/flashcards.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def load_challenges() -> List[Dict[str, Any]]:
    """Load challenges from JSON file."""
    try:
        with open('data/challenges.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def load_courses() -> List[Dict[str, Any]]:
    """Load courses from JSON file."""
    try:
        with open('data/courses.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def load_chats() -> List[Dict[str, Any]]:
    """Load chats from JSON file."""
    try:
        with open('data/chats.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def load_settings() -> Dict[str, Any]:
    """Load settings from JSON file."""
    try:
        with open('data/settings.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

def export_all_data(user_id: str = "default_user") -> Dict[str, Any]:
    """
    Export all learning data for a user including progress, content, and settings.
    """
    # Get all data
    progress_data = load_progress()
    user_progress = progress_data.get(user_id, {})
    
    flashcards = load_flashcards()
    challenges = load_challenges()
    courses = load_courses()
    chats = load_chats()
    settings = load_settings()
    
    # Create export data structure
    export_data = {
        'export_info': {
            'export_date': datetime.now().isoformat(),
            'version': '1.0.0',
            'user_id': user_id,
            'app_name': 'Codivus'
        },
        'user_progress': user_progress,
        'content_data': {
            'flashcards': flashcards,
            'challenges': challenges,
            'courses': courses
        },
        'chat_history': chats,
        'settings': settings,
        'metadata': {
            'total_flashcards': len(flashcards),
            'total_challenges': len(challenges),
            'total_courses': len(courses),
            'total_chats': len(chats),
            'user_level': user_progress.get('level', 1),
            'user_xp': user_progress.get('total_xp', 0),
            'user_achievements': len(user_progress.get('achievements', [])),
            'user_streak': user_progress.get('streak', 0)
        }
    }
    
    return export_data

def export_user_progress_only(user_id: str = "default_user") -> Dict[str, Any]:
    """
    Export only user progress data (for privacy-focused exports).
    """
    progress_data = load_progress()
    user_progress = progress_data.get(user_id, {})
    
    export_data = {
        'export_info': {
            'export_date': datetime.now().isoformat(),
            'version': '1.0.0',
            'user_id': user_id,
            'app_name': 'Codivus',
            'export_type': 'progress_only'
        },
        'user_progress': user_progress,
        'metadata': {
            'user_level': user_progress.get('level', 1),
            'user_xp': user_progress.get('total_xp', 0),
            'user_achievements': len(user_progress.get('achievements', [])),
            'user_streak': user_progress.get('streak', 0)
        }
    }
    
    return export_data

def import_data_from_export(export_data: Dict[str, Any], user_id: str = "default_user") -> Dict[str, Any]:
    """
    Import data from an exported backup file.
    """
    try:
        # Validate export data structure
        if 'export_info' not in export_data:
            return {
                'success': False,
                'error': 'Invalid export file format'
            }
        
        # Import progress data
        if 'user_progress' in export_data:
            progress_data = load_progress()
            progress_data[user_id] = export_data['user_progress']
            
            with open('data/progress.json', 'w') as f:
                json.dump(progress_data, f, indent=2)
        
        # Import content data if present
        if 'content_data' in export_data:
            content_data = export_data['content_data']
            
            if 'flashcards' in content_data:
                with open('data/flashcards.json', 'w') as f:
                    json.dump(content_data['flashcards'], f, indent=2)
            
            if 'challenges' in content_data:
                with open('data/challenges.json', 'w') as f:
                    json.dump(content_data['challenges'], f, indent=2)
            
            if 'courses' in content_data:
                with open('data/courses.json', 'w') as f:
                    json.dump(content_data['courses'], f, indent=2)
        
        # Import chat history if present
        if 'chat_history' in export_data:
            with open('data/chats.json', 'w') as f:
                json.dump(export_data['chat_history'], f, indent=2)
        
        # Import settings if present
        if 'settings' in export_data:
            with open('data/settings.json', 'w') as f:
                json.dump(export_data['settings'], f, indent=2)
        
        return {
            'success': True,
            'message': f'Data imported successfully for user {user_id}',
            'imported_data': {
                'progress': 'user_progress' in export_data,
                'flashcards': 'content_data' in export_data and 'flashcards' in export_data['content_data'],
                'challenges': 'content_data' in export_data and 'challenges' in export_data['content_data'],
                'courses': 'content_data' in export_data and 'courses' in export_data['content_data'],
                'chats': 'chat_history' in export_data,
                'settings': 'settings' in export_data
            }
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': f'Import failed: {str(e)}'
        } 