import json
from typing import Dict, Any, Optional
from datetime import datetime
from .achievement_service import update_achievement_progress, update_streak, calculate_level

def load_progress() -> Dict[str, Any]:
    """Load user progress from JSON file."""
    try:
        with open('data/progress.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

def save_progress(progress: Dict[str, Any]):
    """Save user progress to JSON file."""
    with open('data/progress.json', 'w') as f:
        json.dump(progress, f, indent=2)

def award_xp_for_challenge(user_id: str, challenge_id: int, xp_amount: int, challenge_data: Dict[str, Any] = None) -> Dict[str, Any]:
    """Award XP for completing a challenge."""
    from .challenge_service import update_user_progress
    
    # Use existing challenge service for consistency
    result = update_user_progress(user_id, challenge_id, xp_amount, challenge_data)
    
    # Update streak for any learning activity
    update_streak(user_id)
    
    return result

def award_xp_for_flashcard(user_id: str, flashcard_id: int, xp_amount: int = 10) -> Dict[str, Any]:
    """Award XP for learning a flashcard."""
    progress = load_progress()
    
    if user_id not in progress:
        progress[user_id] = {
            'total_xp': 0,
            'completed_challenges': [],
            'completed_courses': [],
            'completed_lessons': [],
            'level': 1,
            'streak': 0,
            'longest_streak': 0,
            'last_active_date': datetime.now().isoformat(),
            'achievements': [],
            'achievement_progress': {
                'challenges_completed': 0,
                'flashcards_learned': 0,
                'courses_completed': 0,
                'lessons_completed': 0,
                'streak_days': 0,
                'perfect_solutions': 0,
                'different_topics': 0,
                'different_difficulties': 0
            },
            'stats': {
                'total_challenges_completed': 0,
                'total_flashcards_learned': 0,
                'total_courses_completed': 0,
                'total_lessons_completed': 0,
                'total_perfect_solutions': 0,
                'total_topics_covered': 0,
                'total_difficulties_tried': 0,
                'average_challenge_time': 0,
                'favorite_topic': '',
                'favorite_difficulty': ''
            }
        }
    
    user_progress = progress[user_id]
    
    # Update streak first
    user_progress = update_streak(user_id)
    
    # Add XP
    user_progress['total_xp'] += xp_amount
    
    # Update achievement progress
    achievement_result = update_achievement_progress(user_id, 'flashcard_learned', 1)
    
    # Recalculate level
    user_progress['level'] = calculate_level(user_progress['total_xp'])
    
    # Update progress
    progress[user_id] = user_progress
    save_progress(progress)
    
    return {
        'progress': user_progress,
        'new_achievements': achievement_result['new_achievements'],
        'achievement_xp_earned': achievement_result['xp_earned'],
        'total_xp_earned': xp_amount + achievement_result['xp_earned']
    }

def deduct_xp_for_flashcard(user_id: str, flashcard_id: int, xp_amount: int = 10) -> Dict[str, Any]:
    """Deduct XP for forgetting a flashcard."""
    progress = load_progress()
    
    if user_id not in progress:
        return {
            'progress': {},
            'new_achievements': [],
            'achievement_xp_earned': 0,
            'total_xp_earned': 0
        }
    
    user_progress = progress[user_id]
    
    # Update streak first
    user_progress = update_streak(user_id)
    
    # Deduct XP (ensure it doesn't go below 0)
    user_progress['total_xp'] = max(0, user_progress['total_xp'] - xp_amount)
    
    # Update achievement progress (decrease flashcard count)
    achievement_result = update_achievement_progress(user_id, 'flashcard_learned', -1)
    
    # Recalculate level
    user_progress['level'] = calculate_level(user_progress['total_xp'])
    
    # Update progress
    progress[user_id] = user_progress
    save_progress(progress)
    
    return {
        'progress': user_progress,
        'new_achievements': achievement_result['new_achievements'],
        'achievement_xp_earned': achievement_result['xp_earned'],
        'total_xp_earned': -xp_amount + achievement_result['xp_earned']
    }

def award_xp_for_lesson_completion(user_id: str, course_id: str, lesson_id: str, xp_amount: int) -> Dict[str, Any]:
    """Award XP for completing a lesson."""
    progress = load_progress()
    
    if user_id not in progress:
        progress[user_id] = {
            'total_xp': 0,
            'completed_challenges': [],
            'completed_courses': [],
            'completed_lessons': [],
            'level': 1,
            'streak': 0,
            'longest_streak': 0,
            'last_active_date': datetime.now().isoformat(),
            'achievements': [],
            'achievement_progress': {
                'challenges_completed': 0,
                'flashcards_learned': 0,
                'courses_completed': 0,
                'lessons_completed': 0,
                'streak_days': 0,
                'perfect_solutions': 0,
                'different_topics': 0,
                'different_difficulties': 0
            },
            'stats': {
                'total_challenges_completed': 0,
                'total_flashcards_learned': 0,
                'total_courses_completed': 0,
                'total_lessons_completed': 0,
                'total_perfect_solutions': 0,
                'total_topics_covered': 0,
                'total_difficulties_tried': 0,
                'average_challenge_time': 0,
                'favorite_topic': '',
                'favorite_difficulty': ''
            }
        }
    
    user_progress = progress[user_id]
    
    # Update streak first
    user_progress = update_streak(user_id)
    
    # Add XP
    user_progress['total_xp'] += xp_amount
    
    # Update achievement progress
    additional_data = {
        'lesson_id': lesson_id,
        'course_id': course_id
    }
    achievement_result = update_achievement_progress(user_id, 'lesson_completed', 1, additional_data)
    
    # Recalculate level
    user_progress['level'] = calculate_level(user_progress['total_xp'])
    
    # Update progress
    progress[user_id] = user_progress
    save_progress(progress)
    
    return {
        'progress': user_progress,
        'new_achievements': achievement_result['new_achievements'],
        'achievement_xp_earned': achievement_result['xp_earned'],
        'total_xp_earned': xp_amount + achievement_result['xp_earned']
    }

def award_xp_for_course_completion(user_id: str, course_id: str, xp_amount: int) -> Dict[str, Any]:
    """Award XP for completing a course."""
    progress = load_progress()
    
    if user_id not in progress:
        progress[user_id] = {
            'total_xp': 0,
            'completed_challenges': [],
            'completed_courses': [],
            'completed_lessons': [],
            'level': 1,
            'streak': 0,
            'longest_streak': 0,
            'last_active_date': datetime.now().isoformat(),
            'achievements': [],
            'achievement_progress': {
                'challenges_completed': 0,
                'flashcards_learned': 0,
                'courses_completed': 0,
                'lessons_completed': 0,
                'streak_days': 0,
                'perfect_solutions': 0,
                'different_topics': 0,
                'different_difficulties': 0
            },
            'stats': {
                'total_challenges_completed': 0,
                'total_flashcards_learned': 0,
                'total_courses_completed': 0,
                'total_lessons_completed': 0,
                'total_perfect_solutions': 0,
                'total_topics_covered': 0,
                'total_difficulties_tried': 0,
                'average_challenge_time': 0,
                'favorite_topic': '',
                'favorite_difficulty': ''
            }
        }
    
    user_progress = progress[user_id]
    
    # Update streak first
    user_progress = update_streak(user_id)
    
    # Add XP
    user_progress['total_xp'] += xp_amount
    
    # Update achievement progress
    additional_data = {
        'course_id': course_id
    }
    achievement_result = update_achievement_progress(user_id, 'course_completed', 1, additional_data)
    
    # Recalculate level
    user_progress['level'] = calculate_level(user_progress['total_xp'])
    
    # Update progress
    progress[user_id] = user_progress
    save_progress(progress)
    
    return {
        'progress': user_progress,
        'new_achievements': achievement_result['new_achievements'],
        'achievement_xp_earned': achievement_result['xp_earned'],
        'total_xp_earned': xp_amount + achievement_result['xp_earned']
    }

def award_xp_for_perfect_solution(user_id: str, xp_amount: int = 25) -> Dict[str, Any]:
    """Award bonus XP for perfect solution."""
    progress = load_progress()
    
    if user_id not in progress:
        progress[user_id] = {
            'total_xp': 0,
            'completed_challenges': [],
            'completed_courses': [],
            'completed_lessons': [],
            'level': 1,
            'streak': 0,
            'longest_streak': 0,
            'last_active_date': datetime.now().isoformat(),
            'achievements': [],
            'achievement_progress': {
                'challenges_completed': 0,
                'flashcards_learned': 0,
                'courses_completed': 0,
                'lessons_completed': 0,
                'streak_days': 0,
                'perfect_solutions': 0,
                'different_topics': 0,
                'different_difficulties': 0
            },
            'stats': {
                'total_challenges_completed': 0,
                'total_flashcards_learned': 0,
                'total_courses_completed': 0,
                'total_lessons_completed': 0,
                'total_perfect_solutions': 0,
                'total_topics_covered': 0,
                'total_difficulties_tried': 0,
                'average_challenge_time': 0,
                'favorite_topic': '',
                'favorite_difficulty': ''
            }
        }
    
    user_progress = progress[user_id]
    
    # Update streak first
    user_progress = update_streak(user_id)
    
    # Add XP
    user_progress['total_xp'] += xp_amount
    
    # Update achievement progress
    achievement_result = update_achievement_progress(user_id, 'perfect_solution', 1)
    
    # Recalculate level
    user_progress['level'] = calculate_level(user_progress['total_xp'])
    
    # Update progress
    progress[user_id] = user_progress
    save_progress(progress)
    
    return {
        'progress': user_progress,
        'new_achievements': achievement_result['new_achievements'],
        'achievement_xp_earned': achievement_result['xp_earned'],
        'total_xp_earned': xp_amount + achievement_result['xp_earned']
    }

def get_user_progress(user_id: str) -> Dict[str, Any]:
    """Get user progress with streak update."""
    progress = load_progress()
    
    if user_id not in progress:
        # Initialize new user
        progress[user_id] = {
            'total_xp': 0,
            'completed_challenges': [],
            'completed_courses': [],
            'completed_lessons': [],
            'level': 1,
            'streak': 0,
            'longest_streak': 0,
            'last_active_date': datetime.now().isoformat(),
            'achievements': [],
            'achievement_progress': {
                'challenges_completed': 0,
                'flashcards_learned': 0,
                'courses_completed': 0,
                'lessons_completed': 0,
                'streak_days': 0,
                'perfect_solutions': 0,
                'different_topics': 0,
                'different_difficulties': 0
            },
            'stats': {
                'total_challenges_completed': 0,
                'total_flashcards_learned': 0,
                'total_courses_completed': 0,
                'total_lessons_completed': 0,
                'total_perfect_solutions': 0,
                'total_topics_covered': 0,
                'total_difficulties_tried': 0,
                'average_challenge_time': 0,
                'favorite_topic': '',
                'favorite_difficulty': ''
            }
        }
        save_progress(progress)
        return progress[user_id]
    
    # Update streak for existing user
    user_progress = update_streak(user_id)
    
    # Fix achievement progress by recalculating based on actual data
    from .achievement_service import fix_achievement_progress
    fix_achievement_progress(user_id)
    
    # Reload and return updated progress
    progress = load_progress()
    return progress[user_id] 