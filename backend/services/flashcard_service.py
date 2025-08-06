import json
import os
from typing import List, Dict, Any

DATA_PATH = os.path.join(os.path.dirname(__file__), '../data/flashcards.json')

def load_flashcards() -> List[Dict[str, Any]]:
    with open(DATA_PATH, 'r') as f:
        return json.load(f)

def save_flashcards(flashcards: List[Dict[str, Any]]):
    with open(DATA_PATH, 'w') as f:
        json.dump(flashcards, f, indent=2)

def get_all_flashcards() -> List[Dict[str, Any]]:
    return load_flashcards()

def add_flashcard(flashcard: Dict[str, Any]) -> Dict[str, Any]:
    flashcards = load_flashcards()
    flashcard['id'] = max([f.get('id', 0) for f in flashcards] or [0]) + 1
    flashcards.append(flashcard)
    save_flashcards(flashcards)
    return flashcard

def update_flashcard(flashcard_id: int, updated: Dict[str, Any]) -> Dict[str, Any]:
    flashcards = load_flashcards()
    for i, f in enumerate(flashcards):
        if f.get('id') == flashcard_id:
            flashcards[i].update(updated)
            save_flashcards(flashcards)
            return flashcards[i]
    raise ValueError('Flashcard not found')

def delete_flashcard(flashcard_id: int):
    flashcards = load_flashcards()
    new_flashcards = [f for f in flashcards if f.get('id') != flashcard_id]
    if len(new_flashcards) == len(flashcards):
        raise ValueError('Flashcard not found')
    save_flashcards(new_flashcards)

def mark_flashcard_learned(user_id: str, flashcard_id: int) -> Dict[str, Any]:
    """Mark a flashcard as learned and award XP."""
    from .xp_service import award_xp_for_flashcard
    
    # Award XP for learning flashcard
    result = award_xp_for_flashcard(user_id, flashcard_id, 10)
    
    return {
        'success': True,
        'new_achievements': result['new_achievements'],
        'achievement_xp_earned': result['achievement_xp_earned'],
        'total_xp_earned': result['total_xp_earned'],
        'updated_progress': result['progress']
    } 