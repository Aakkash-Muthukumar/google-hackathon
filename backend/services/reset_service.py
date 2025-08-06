import json
from typing import Dict, Any
from datetime import datetime

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

def reset_user_progress(user_id: str = "default_user") -> Dict[str, Any]:
    """
    Reset all progress data for a user while preserving content data.
    This resets XP, level, streak, achievements, and progress tracking.
    """
    progress = load_progress()
    
    # Reset progress data for the user
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
    
    # Also reset course and challenge progress
    reset_course_progress()
    reset_challenge_progress()
    
    return {
        'success': True,
        'message': f'Progress reset successfully for user {user_id}',
        'reset_data': progress[user_id]
    }

def reset_course_progress():
    """
    Reset all course and lesson progress while preserving course content.
    """
    try:
        with open('data/courses.json', 'r') as f:
            courses = json.load(f)
        
        # Reset progress for each course and lesson
        for course in courses:
            course['progress'] = 0
            course['completed'] = False
            course['totalXP'] = 0
            course['dailyStreak'] = 0
            
            # Reset progress for each lesson
            for lesson in course.get('lessons', []):
                lesson['completed'] = False
                lesson['progress'] = 0
        
        # Save the updated courses
        with open('data/courses.json', 'w') as f:
            json.dump(courses, f, indent=2)
            
    except Exception as e:
        print(f"Error resetting course progress: {e}")

def reset_challenge_progress():
    """
    Reset all challenge completion status while preserving challenge content.
    """
    try:
        with open('data/challenges.json', 'r') as f:
            challenges = json.load(f)
        
        # Reset completion status for each challenge
        for challenge in challenges:
            challenge['completed'] = False
        
        # Save the updated challenges
        with open('data/challenges.json', 'w') as f:
            json.dump(challenges, f, indent=2)
            
    except Exception as e:
        print(f"Error resetting challenge progress: {e}")

def reset_all_users_progress() -> Dict[str, Any]:
    """
    Reset progress data for all users in the system.
    """
    progress = load_progress()
    
    for user_id in progress.keys():
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
    
    # Also reset course and challenge progress
    reset_course_progress()
    reset_challenge_progress()
    
    return {
        'success': True,
        'message': f'Progress reset successfully for {len(progress)} users',
        'users_reset': list(progress.keys())
    } 