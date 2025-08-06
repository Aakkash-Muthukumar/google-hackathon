import json
from typing import Dict, List, Any, Optional
from datetime import datetime, date, timedelta
import os

# Achievement definitions
ACHIEVEMENTS = {
    # Challenge-based achievements
    "first_challenge": {
        "id": "first_challenge",
        "title": "First Steps",
        "description": "Complete your first coding challenge",
        "icon": "🎯",
        "type": "challenge",
        "requirement": {"challenges_completed": 1},
        "xp_reward": 50
    },
    "challenge_master_5": {
        "id": "challenge_master_5",
        "title": "Challenge Apprentice",
        "description": "Complete 5 coding challenges",
        "icon": "⚡",
        "type": "challenge",
        "requirement": {"challenges_completed": 5},
        "xp_reward": 100
    },
    "challenge_master_10": {
        "id": "challenge_master_10",
        "title": "Challenge Adept",
        "description": "Complete 10 coding challenges",
        "icon": "🔥",
        "type": "challenge",
        "requirement": {"challenges_completed": 10},
        "xp_reward": 200
    },
    "challenge_master_25": {
        "id": "challenge_master_25",
        "title": "Challenge Expert",
        "description": "Complete 25 coding challenges",
        "icon": "💎",
        "type": "challenge",
        "requirement": {"challenges_completed": 25},
        "xp_reward": 500
    },
    "challenge_master_50": {
        "id": "challenge_master_50",
        "title": "Challenge Master",
        "description": "Complete 50 coding challenges",
        "icon": "👑",
        "type": "challenge",
        "requirement": {"challenges_completed": 50},
        "xp_reward": 1000
    },
    
    # Streak-based achievements
    "streak_3_days": {
        "id": "streak_3_days",
        "title": "Getting Started",
        "description": "Maintain a 3-day learning streak",
        "icon": "🔥",
        "type": "streak",
        "requirement": {"streak_days": 3},
        "xp_reward": 75
    },
    "streak_7_days": {
        "id": "streak_7_days",
        "title": "Week Warrior",
        "description": "Maintain a 7-day learning streak",
        "icon": "🔥🔥",
        "type": "streak",
        "requirement": {"streak_days": 7},
        "xp_reward": 150
    },
    "streak_14_days": {
        "id": "streak_14_days",
        "title": "Fortnight Fighter",
        "description": "Maintain a 14-day learning streak",
        "icon": "🔥🔥🔥",
        "type": "streak",
        "requirement": {"streak_days": 14},
        "xp_reward": 300
    },
    "streak_30_days": {
        "id": "streak_30_days",
        "title": "Monthly Master",
        "description": "Maintain a 30-day learning streak",
        "icon": "🔥🔥🔥🔥",
        "type": "streak",
        "requirement": {"streak_days": 30},
        "xp_reward": 750
    },
    
    # Level-based achievements
    "level_3": {
        "id": "level_3",
        "title": "Rising Star",
        "description": "Reach level 3",
        "icon": "⭐",
        "type": "level",
        "requirement": {"level": 3},
        "xp_reward": 100
    },
    "level_5": {
        "id": "level_5",
        "title": "Code Explorer",
        "description": "Reach level 5",
        "icon": "⭐⭐",
        "type": "level",
        "requirement": {"level": 5},
        "xp_reward": 200
    },
    "level_10": {
        "id": "level_10",
        "title": "Programming Pioneer",
        "description": "Reach level 10",
        "icon": "⭐⭐⭐",
        "type": "level",
        "requirement": {"level": 10},
        "xp_reward": 500
    },
    "level_20": {
        "id": "level_20",
        "title": "Code Champion",
        "description": "Reach level 20",
        "icon": "⭐⭐⭐⭐",
        "type": "level",
        "requirement": {"level": 20},
        "xp_reward": 1000
    },
    "level_50": {
        "id": "level_50",
        "title": "Programming Legend",
        "description": "Reach level 50",
        "icon": "⭐⭐⭐⭐⭐",
        "type": "level",
        "requirement": {"level": 50},
        "xp_reward": 2500
    },
    
    # Topic-based achievements
    "topic_explorer": {
        "id": "topic_explorer",
        "title": "Topic Explorer",
        "description": "Complete challenges in 3 different topics",
        "icon": "🗺️",
        "type": "topic",
        "requirement": {"different_topics": 3},
        "xp_reward": 150
    },
    "topic_master": {
        "id": "topic_master",
        "title": "Topic Master",
        "description": "Complete challenges in 5 different topics",
        "icon": "🗺️🗺️",
        "type": "topic",
        "requirement": {"different_topics": 5},
        "xp_reward": 300
    },
    
    # Difficulty-based achievements
    "difficulty_diver": {
        "id": "difficulty_diver",
        "title": "Difficulty Diver",
        "description": "Complete challenges of all difficulty levels",
        "icon": "🎯",
        "type": "difficulty",
        "requirement": {"different_difficulties": 3},
        "xp_reward": 200
    },
    
    # Flashcard achievements
    "flashcard_learner": {
        "id": "flashcard_learner",
        "title": "Flashcard Learner",
        "description": "Learn 10 flashcards",
        "icon": "📚",
        "type": "flashcard",
        "requirement": {"flashcards_learned": 10},
        "xp_reward": 100
    },
    "flashcard_master": {
        "id": "flashcard_master",
        "title": "Flashcard Master",
        "description": "Learn 50 flashcards",
        "icon": "📚📚",
        "type": "flashcard",
        "requirement": {"flashcards_learned": 50},
        "xp_reward": 300
    },
    
    # Perfect solution achievements
    "perfect_solver": {
        "id": "perfect_solver",
        "title": "Perfect Solver",
        "description": "Get 5 perfect solutions",
        "icon": "🎯",
        "type": "perfect",
        "requirement": {"perfect_solutions": 5},
        "xp_reward": 250
    },
    "perfect_master": {
        "id": "perfect_master",
        "title": "Perfect Master",
        "description": "Get 20 perfect solutions",
        "icon": "🎯🎯",
        "type": "perfect",
        "requirement": {"perfect_solutions": 20},
        "xp_reward": 750
    }
}

def load_progress() -> Dict[str, Any]:
    """Load user progress from JSON file."""
    try:
        with open('data/progress.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

def save_progress(progress: Dict[str, Any]):
    """Save user progress to JSON file."""
    os.makedirs('data', exist_ok=True)
    with open('data/progress.json', 'w') as f:
        json.dump(progress, f, indent=2)

def calculate_level(total_xp: int) -> int:
    """Calculate level based on total XP using a progressive formula."""
    # Level 1: 0-99 XP
    # Level 2: 100-299 XP (200 XP needed)
    # Level 3: 300-599 XP (300 XP needed)
    # Level 4: 600-999 XP (400 XP needed)
    # And so on...
    if total_xp < 100:
        return 1
    
    level = 1
    xp_needed = 100
    xp_remaining = total_xp
    
    while xp_remaining >= xp_needed:
        xp_remaining -= xp_needed
        level += 1
        xp_needed = level * 100
    
    return level

def calculate_xp_to_next_level(total_xp: int) -> int:
    """Calculate XP needed to reach the next level."""
    current_level = calculate_level(total_xp)
    xp_for_current_level = sum(i * 100 for i in range(1, current_level))
    xp_for_next_level = sum(i * 100 for i in range(1, current_level + 1))
    return xp_for_next_level - total_xp

def update_streak(user_id: str) -> Dict[str, Any]:
    """Update user streak based on activity."""
    progress = load_progress()
    
    if user_id not in progress:
        progress[user_id] = {
            'total_xp': 0,
            'completed_challenges': [],
            'level': 1,
            'streak': 0,
            'longest_streak': 0,
            'last_active_date': date.today().isoformat(),
            'achievements': [],
            'achievement_progress': {
                'challenges_completed': 0,
                'flashcards_learned': 0,
                'streak_days': 0,
                'perfect_solutions': 0,
                'different_topics': 0,
                'different_difficulties': 0
            },
            'stats': {
                'total_challenges_completed': 0,
                'total_flashcards_learned': 0,
                'total_perfect_solutions': 0,
                'total_topics_covered': 0,
                'total_difficulties_tried': 0,
                'average_challenge_time': 0,
                'favorite_topic': '',
                'favorite_difficulty': ''
            }
        }
    
    user_progress = progress[user_id]
    today = date.today().isoformat()
    last_active = user_progress.get('last_active_date', '')
    
    # Check if user was active yesterday
    if last_active == today:
        # Already updated today
        return user_progress
    
    try:
        last_active_date = datetime.strptime(last_active, '%Y-%m-%d').date()
        yesterday = date.today() - timedelta(days=1)
        
        if last_active_date == yesterday:
            # Consecutive day
            user_progress['streak'] += 1
        elif last_active_date < yesterday:
            # Streak broken
            user_progress['streak'] = 1
        else:
            # Same day or future date (shouldn't happen)
            pass
    except (ValueError, TypeError):
        # First time or invalid date
        user_progress['streak'] = 1
    
    # Update longest streak
    if user_progress['streak'] > user_progress.get('longest_streak', 0):
        user_progress['longest_streak'] = user_progress['streak']
    
    user_progress['last_active_date'] = today
    user_progress['achievement_progress']['streak_days'] = user_progress['streak']
    
    save_progress(progress)
    return user_progress

def check_achievements(user_id: str, progress_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Check for newly unlocked achievements."""
    user_progress = progress_data.get(user_id, {})
    current_achievements = set(user_progress.get('achievements', []))
    achievement_progress = user_progress.get('achievement_progress', {})
    
    newly_unlocked = []
    
    for achievement_id, achievement in ACHIEVEMENTS.items():
        if achievement_id in current_achievements:
            continue
        
        requirement = achievement['requirement']
        unlocked = True
        
        for key, required_value in requirement.items():
            current_value = achievement_progress.get(key, 0)
            if current_value < required_value:
                unlocked = False
                break
        
        if unlocked:
            newly_unlocked.append(achievement)
    
    return newly_unlocked

def unlock_achievements(user_id: str, achievements: List[Dict[str, Any]]) -> int:
    """Unlock achievements and return total XP earned."""
    if not achievements:
        return 0
    
    progress = load_progress()
    user_progress = progress.get(user_id, {})
    current_achievements = user_progress.get('achievements', [])
    
    total_xp_earned = 0
    
    for achievement in achievements:
        if achievement['id'] not in current_achievements:
            current_achievements.append(achievement['id'])
            total_xp_earned += achievement['xp_reward']
    
    user_progress['achievements'] = current_achievements
    user_progress['total_xp'] += total_xp_earned
    
    # Recalculate level
    user_progress['level'] = calculate_level(user_progress['total_xp'])
    
    progress[user_id] = user_progress
    save_progress(progress)
    
    return total_xp_earned

def update_achievement_progress(user_id: str, progress_type: str, value: int = 1, 
                              additional_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Update achievement progress and check for new unlocks."""
    progress = load_progress()
    
    if user_id not in progress:
        progress[user_id] = {
            'total_xp': 0,
            'completed_challenges': [],
            'level': 1,
            'streak': 0,
            'longest_streak': 0,
            'last_active_date': date.today().isoformat(),
            'achievements': [],
            'achievement_progress': {
                'challenges_completed': 0,
                'flashcards_learned': 0,
                'streak_days': 0,
                'perfect_solutions': 0,
                'different_topics': 0,
                'different_difficulties': 0
            },
            'stats': {
                'total_challenges_completed': 0,
                'total_flashcards_learned': 0,
                'total_perfect_solutions': 0,
                'total_topics_covered': 0,
                'total_difficulties_tried': 0,
                'average_challenge_time': 0,
                'favorite_topic': '',
                'favorite_difficulty': ''
            }
        }
    
    user_progress = progress[user_id]
    achievement_progress = user_progress['achievement_progress']
    stats = user_progress['stats']
    
    # Update progress based on type
    if progress_type == 'challenge_completed':
        achievement_progress['challenges_completed'] += value
        stats['total_challenges_completed'] += value
        
        if additional_data:
            # Track topics and difficulties
            topic = additional_data.get('topic', '')
            difficulty = additional_data.get('difficulty', '')
            
            # Update topic tracking
            if topic:
                current_topics = stats.get('topics_covered', set())
                if isinstance(current_topics, list):
                    current_topics = set(current_topics)
                current_topics.add(topic)
                stats['topics_covered'] = list(current_topics)
                stats['total_topics_covered'] = len(current_topics)
                achievement_progress['different_topics'] = len(current_topics)
            
            # Update difficulty tracking
            if difficulty:
                current_difficulties = stats.get('difficulties_tried', set())
                if isinstance(current_difficulties, list):
                    current_difficulties = set(current_difficulties)
                current_difficulties.add(difficulty)
                stats['difficulties_tried'] = list(current_difficulties)
                stats['total_difficulties_tried'] = len(current_difficulties)
                achievement_progress['different_difficulties'] = len(current_difficulties)
    
    elif progress_type == 'flashcard_learned':
        achievement_progress['flashcards_learned'] += value
        stats['total_flashcards_learned'] += value
    
    elif progress_type == 'perfect_solution':
        achievement_progress['perfect_solutions'] += value
        stats['total_perfect_solutions'] += value
    
    # Check for new achievements
    new_achievements = check_achievements(user_id, progress)
    xp_earned = unlock_achievements(user_id, new_achievements)
    
    save_progress(progress)
    
    return {
        'new_achievements': new_achievements,
        'xp_earned': xp_earned,
        'updated_progress': user_progress
    }

def get_user_achievements(user_id: str) -> Dict[str, Any]:
    """Get user's achievements and progress."""
    progress = load_progress()
    user_progress = progress.get(user_id, {})
    
    unlocked_achievements = []
    locked_achievements = []
    
    for achievement_id, achievement in ACHIEVEMENTS.items():
        achievement_copy = achievement.copy()
        achievement_copy['unlocked'] = achievement_id in user_progress.get('achievements', [])
        
        if achievement_copy['unlocked']:
            unlocked_achievements.append(achievement_copy)
        else:
            locked_achievements.append(achievement_copy)
    
    return {
        'unlocked_achievements': unlocked_achievements,
        'locked_achievements': locked_achievements,
        'achievement_progress': user_progress.get('achievement_progress', {}),
        'total_achievements': len(ACHIEVEMENTS),
        'unlocked_count': len(unlocked_achievements)
    }

def get_level_up_info(user_id: str) -> Dict[str, Any]:
    """Get level up information for the user."""
    progress = load_progress()
    user_progress = progress.get(user_id, {})
    
    total_xp = user_progress.get('total_xp', 0)
    current_level = calculate_level(total_xp)
    xp_to_next = calculate_xp_to_next_level(total_xp)
    
    return {
        'current_level': current_level,
        'total_xp': total_xp,
        'xp_to_next_level': xp_to_next,
        'xp_in_current_level': total_xp - sum(i * 100 for i in range(1, current_level)),
        'level_progress_percentage': ((total_xp - sum(i * 100 for i in range(1, current_level))) / (current_level * 100)) * 100
    } 