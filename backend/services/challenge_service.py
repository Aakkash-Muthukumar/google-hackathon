import sys
import subprocess
from backend.services.ai_service import ask_gemma
import json

# 1. Format a prompt for the model

def format_prompt(problem, user_code, test_cases):
    """
    Build a prompt for the model including the problem description, input/output format, test cases, and user code.
    """
    prompt = f"""
You are an expert coding tutor. Analyze the following code for the given problem and test cases.
Return a JSON object with two fields:
- 'correct': true or false (whether the code is correct for all test cases)
- 'feedback': a short explanation or suggestion for the user.

Problem: {problem['description']}
Input Format: {problem['input_format']}
Output Format: {problem['output_format']}
Test Cases: {test_cases}
User Code:
{user_code}
"""
    return prompt

# 2. Call the model for verification

def verify_with_model(problem, user_code, test_cases):
    """
    Use ask_gemma to verify the user code against the problem and test cases.
    Returns a dict with 'correct' and 'feedback'.
    """
    prompt = format_prompt(problem, user_code, test_cases)
    result = ask_gemma(prompt)
    try:
        # Try to parse the model's response as JSON
        parsed = json.loads(result)
        if isinstance(parsed, dict) and 'correct' in parsed and 'feedback' in parsed:
            return parsed
        else:
            return {'correct': False, 'feedback': 'Model response did not contain expected fields.'}
    except Exception:
        return {'correct': False, 'feedback': f'Model response could not be parsed as JSON: {result}'}

# 3. Local sandboxed code execution (Unix only)

def run_user_code(code, input_data):
    """
    Run user code in a subprocess with CPU and memory limits.
    Returns (stdout, stderr).
    """
    try:
        result = subprocess.run(
            [sys.executable, "-c", code],
            input=input_data.encode(),
            capture_output=True,
            timeout=2,
        )
        return result.stdout.decode(), result.stderr.decode()
    except subprocess.TimeoutExpired:
        return "", "Time Limit Exceeded"
    except Exception as e:
        return "", str(e)

# You can now use verify_with_model for LLM-based checking, and run_user_code for local execution. 