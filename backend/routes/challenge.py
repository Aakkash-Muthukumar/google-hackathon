from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from typing import List, Optional
from services.challenge_service import (
    load_challenges, save_challenges, generate_challenge, verify_with_model,
    get_solution, get_hints, get_congrats_feedback, update_user_progress, get_user_progress
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
        result = verify_with_model(challenge, request.user_code, challenge.get('examples', []))
        
        # If solution is correct, update user progress
        if result.get('correct', False):
            xp_earned = challenge.get('xpReward', 50)
            user_progress = update_user_progress(request.user_id, request.challenge_id, xp_earned)
            result['xp_earned'] = xp_earned
            result['user_progress'] = user_progress
        
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