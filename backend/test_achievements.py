#!/usr/bin/env python3
"""
Test script for the achievement system
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from services.achievement_service import (
    ACHIEVEMENTS, 
    calculate_level, 
    calculate_xp_to_next_level,
    update_streak,
    check_achievements,
    unlock_achievements,
    get_user_achievements,
    get_level_up_info
)

def test_achievement_system():
    print("🧪 Testing Achievement System")
    print("=" * 50)
    
    # Test 1: Check achievements loaded
    print(f"✅ Found {len(ACHIEVEMENTS)} achievements")
    
    # Test 2: Level calculation
    print("\n📊 Testing Level Calculation:")
    test_xp_values = [0, 50, 100, 250, 500, 1000, 2000]
    for xp in test_xp_values:
        level = calculate_level(xp)
        xp_to_next = calculate_xp_to_next_level(xp)
        print(f"  {xp} XP → Level {level} (need {xp_to_next} more for next level)")
    
    # Test 3: Achievement checking
    print("\n🏆 Testing Achievement System:")
    user_id = "test_user"
    
    # Simulate user progress
    test_progress = {
        user_id: {
            'total_xp': 0,
            'completed_challenges': [],
            'level': 1,
            'streak': 0,
            'longest_streak': 0,
            'last_active_date': '2024-01-15',
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
    }
    
    # Test first challenge completion
    test_progress[user_id]['achievement_progress']['challenges_completed'] = 1
    test_progress[user_id]['total_xp'] = 50
    
    new_achievements = check_achievements(user_id, test_progress)
    print(f"  First challenge completion: {len(new_achievements)} new achievements")
    for achievement in new_achievements:
        print(f"    🎯 {achievement['title']}: {achievement['description']}")
    
    # Test level 3 achievement
    test_progress[user_id]['total_xp'] = 300
    test_progress[user_id]['level'] = 3
    
    new_achievements = check_achievements(user_id, test_progress)
    print(f"  Level 3: {len(new_achievements)} new achievements")
    for achievement in new_achievements:
        print(f"    ⭐ {achievement['title']}: {achievement['description']}")
    
    # Test streak achievement
    test_progress[user_id]['achievement_progress']['streak_days'] = 3
    
    new_achievements = check_achievements(user_id, test_progress)
    print(f"  3-day streak: {len(new_achievements)} new achievements")
    for achievement in new_achievements:
        print(f"    🔥 {achievement['title']}: {achievement['description']}")
    
    print("\n✅ Achievement system test completed successfully!")

if __name__ == "__main__":
    test_achievement_system() 