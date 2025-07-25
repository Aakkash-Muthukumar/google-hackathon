from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from backend.services.challenge_service import run_user_code
from backend.services.ai_service import ask_gemma
import json
import os

router = APIRouter(prefix="/challenge")

# Path to challenges.json
data_path = os.path.join(os.path.dirname(__file__), '../data/challenges.json')

def load_challenges():
    if not os.path.exists(data_path):
        with open(data_path, 'w') as f:
            json.dump([], f)
    with open(data_path, 'r') as f:
        return json.load(f)

class VerifyRequest(BaseModel):
    challenge_id: int
    user_code: str

class ChallengeIdRequest(BaseModel):
    challenge_id: int

class CongratsRequest(BaseModel):
    title: str
    user_code: str

@router.get("/all")
def get_all_challenges():
    """Return all coding challenges for the frontend."""
    return load_challenges()

@router.post("/solution")
def get_solution(request: ChallengeIdRequest):
    challenges = load_challenges()
    challenge = next((c for c in challenges if c["id"] == request.challenge_id), None)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found.")
    prompt = f"""
You are an expert coding tutor. Provide a clean, idiomatic solution in Python for the following problem, and explain the solution at the end:

Title: {challenge['title']}
Description: {challenge['description']}
Input Format: {challenge.get('input_format', '')}
Output Format: {challenge.get('output_format', '')}
"""
    solution = ask_gemma(prompt)
    return {"solution": solution}

@router.post("/hints")
def get_hints(request: ChallengeIdRequest):
    challenges = load_challenges()
    challenge = next((c for c in challenges if c["id"] == request.challenge_id), None)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found.")
    prompt = f"""
You are an expert coding tutor. Provide 3 helpful hints for solving the following problem. Do not give away the full solution.

Title: {challenge['title']}
Description: {challenge['description']}
Input Format: {challenge.get('input_format', '')}
Output Format: {challenge.get('output_format', '')}
"""
    hints = ask_gemma(prompt)
    return {"hints": hints}

@router.post("/verify")
def verify_challenge(request: VerifyRequest):
    challenges = load_challenges()
    challenge = next((c for c in challenges if c["id"] == request.challenge_id), None)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found.")
    test_cases = challenge.get("examples", [])
    results = []
    for case in test_cases:
        input_data = json.dumps(case["input"]) if isinstance(case["input"], dict) else str(case["input"])
        expected_output = case["output"]
        output, error = run_user_code(request.user_code, input_data)
        results.append({
            "input": input_data,
            "expected_output": expected_output,
            "output": output.strip(),
            "error": error.strip(),
            "pass": output.strip() == str(expected_output) and not error
        })
    return {"results": results}

@router.post("/congrats")
def congrats_feedback(request: CongratsRequest):
    prompt = f"""
You are an expert coding tutor. The user has just solved the following challenge:

Title: {request.title}

Here is their solution:
{request.user_code}

Congratulate the user, and provide a brief, constructive review of their code style, efficiency, and any suggestions for improvement. Be positive and encouraging!"""
    feedback = ask_gemma(prompt)
    return {"feedback": feedback}

progress_path = os.path.join(os.path.dirname(__file__), '../data/progress.json')

def load_progress():
    if not os.path.exists(progress_path):
        with open(progress_path, 'w') as f:
            json.dump({}, f)
    with open(progress_path, 'r') as f:
        return json.load(f)

@router.get("/progress")
def get_progress():
    """Return user progress (past challenges, XP, etc.)."""
    return load_progress() 