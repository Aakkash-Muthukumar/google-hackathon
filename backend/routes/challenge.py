from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from typing import List, Optional
from services.challenge_service import (
    load_challenges, save_challenges, generate_challenge, verify_with_model,
    get_solution, get_hints, get_congrats_feedback, update_user_progress, get_user_progress,
    mark_challenge_completed, reset_completed_challenges
)
import json

router = APIRouter(prefix="/challenge")

class ChallengeIdRequest(BaseModel):
    challenge_id: int

class VerifyRequest(BaseModel):
    challenge_id: int
    user_code: str
    user_id: str = "default_user"  # Default user ID for now

class GenerateRequest(BaseModel):
    difficulty: str = "easy"
    topic: str = "algorithms"
    language: str = "python"

class CongratsRequest(BaseModel):
    title: str
    user_code: str

class ProgressRequest(BaseModel):
    user_id: str = "default_user"

@router.get("/all")
def get_all_challenges():
    """Get all available challenges"""
    try:
        challenges = load_challenges()
        return {"challenges": challenges}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load challenges: {str(e)}")

@router.post("/all-with-progress")
def get_challenges_with_progress(request: ProgressRequest):
    """Get all challenges with completion status for a specific user"""
    try:
        from services.challenge_service import update_challenge_completion_status
        challenges = load_challenges()
        # Update completion status for the specific user
        updated_challenges = update_challenge_completion_status(challenges, request.user_id)
        return {"challenges": updated_challenges}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load challenges: {str(e)}")

@router.post("/generate")
def generate_new_challenge(request: GenerateRequest):
    """Generate a new challenge using AI"""
    try:
        challenge = generate_challenge(
            difficulty=request.difficulty,
            topic=request.topic,
            language=request.language
        )
        
        # Save the new challenge
        challenges = load_challenges()
        challenges.append(challenge)
        save_challenges(challenges)
        
        return {"challenge": challenge, "message": "Challenge generated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate challenge: {str(e)}")

@router.post("/verify")
def verify_solution(request: VerifyRequest):
    """Verify user solution using AI model"""
    try:
        challenges = load_challenges()
        challenge = next((c for c in challenges if c["id"] == request.challenge_id), None)
        
        if not challenge:
            raise HTTPException(status_code=404, detail="Challenge not found")
        
        # Use AI model to verify the solution
        print(f"Verifying challenge {request.challenge_id} with code length: {len(request.user_code)}")
        result = verify_with_model(challenge, request.user_code, challenge.get('examples', []))
        print(f"AI verification result: {result.get('correct', 'unknown')}")
        
        # Check if the code is actually complete before considering AI verification result
        user_code_clean = request.user_code.strip()
        is_complete_code = (
            user_code_clean and 
            not user_code_clean.endswith('pass') and
            not '# Your code here' in user_code_clean and
            'return ' in user_code_clean and  # Must have a return statement
            len(user_code_clean.split('\n')) > 5  # Must have more than just template
        )
        
        print(f"Code completeness check: {is_complete_code}")
        # Only consider AI verification if code is actually complete
        if is_complete_code and result.get('correct', False):
            xp_earned = challenge.get('xpReward', 50)
            user_progress = update_user_progress(request.user_id, request.challenge_id, xp_earned)
            result['xp_earned'] = xp_earned
            result['user_progress'] = user_progress
        else:
            # If code is incomplete, override AI result and mark as failed
            result['correct'] = False
            result['feedback'] = 'Code is incomplete. Please implement a complete solution.'
            result['test_results'] = [{
                'input': str(test_case['input']),
                'expected_output': str(test_case['output']),
                'actual_output': 'Code incomplete',
                'pass': False
            } for test_case in challenge.get('examples', [])]
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to verify solution: {str(e)}")

@router.post("/solution")
def get_solution_endpoint(request: ChallengeIdRequest):
    """Get AI-generated solution for a challenge"""
    try:
        challenges = load_challenges()
        challenge = next((c for c in challenges if c["id"] == request.challenge_id), None)
        
        if not challenge:
            raise HTTPException(status_code=404, detail="Challenge not found")
        
        solution = get_solution(challenge)
        return {"solution": solution}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get solution: {str(e)}")

@router.post("/hints")
def get_hints_endpoint(request: ChallengeIdRequest):
    """Get AI-generated hints for a challenge"""
    try:
        challenges = load_challenges()
        challenge = next((c for c in challenges if c["id"] == request.challenge_id), None)
        
        if not challenge:
            raise HTTPException(status_code=404, detail="Challenge not found")
        
        hints = get_hints(challenge)
        return {"hints": hints}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get hints: {str(e)}")

@router.post("/congrats")
def congrats_feedback(request: CongratsRequest):
    """Get congratulatory feedback when user solves a challenge"""
    try:
        feedback = get_congrats_feedback(request.title, request.user_code)
        return {"feedback": feedback}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get feedback: {str(e)}")

@router.post("/progress")
def get_progress(request: ProgressRequest):
    """Get user progress information"""
    try:
        progress = get_user_progress(request.user_id)
        return progress
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get progress: {str(e)}")

@router.post("/test")
def test_challenge_generation():
    """Test endpoint to generate a sample challenge"""
    try:
        challenge = generate_challenge("easy", "arrays", "python")
        return {"challenge": challenge, "message": "Test challenge generated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate test challenge: {str(e)}")

@router.post("/reset-completed")
def reset_completed():
    """Reset all completed challenges when challenges.json is deleted"""
    try:
        success = reset_completed_challenges()
        if success:
            return {"message": "Completed challenges reset successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to reset completed challenges")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reset completed challenges: {str(e)}") 