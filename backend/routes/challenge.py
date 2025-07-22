from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.services.challenge_service import verify_with_model, run_user_code
import json
import os

router = APIRouter(prefix="/challenge")

# Path to challenges.json
data_path = os.path.join(os.path.dirname(__file__), '../data/challenges.json')

def load_challenges():
    with open(data_path, 'r') as f:
        return json.load(f)

class VerifyRequest(BaseModel):
    challenge_id: int
    user_code: str
    method: str = "model"  # "model" or "local"

@router.post("/verify")
def verify_challenge(request: VerifyRequest):
    challenges = load_challenges()
    challenge = next((c for c in challenges if c["id"] == request.challenge_id), None)
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found.")
    test_cases = challenge.get("examples", [])
    if request.method == "model":
        result = verify_with_model(challenge, request.user_code, test_cases)
        return {"result": result}
    elif request.method == "local":
        # For local, run user code on all test cases and collect results
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
    else:
        raise HTTPException(status_code=400, detail="Invalid method. Use 'model' or 'local'.") 