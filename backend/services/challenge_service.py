import sys
import subprocess
import resource
from backend.services.ai_service import ask_gemma

# 1. Format a prompt for the model

def format_prompt(problem, user_code, test_cases):
    """
    Build a prompt for the model including the problem description, input/output format, test cases, and user code.
    """
    prompt = f"""
Problem: {problem['description']}
Input Format: {problem['input_format']}
Output Format: {problem['output_format']}
Test Cases: {test_cases}
User Code:
{user_code}
Please check if the user code solves the problem for all test cases. Respond with pass/fail for each case.
"""
    return prompt

# 2. Call the model for verification

def verify_with_model(problem, user_code, test_cases):
    """
    Use ask_gemma to verify the user code against the problem and test cases.
    """
    prompt = format_prompt(problem, user_code, test_cases)
    result = ask_gemma(prompt)
    return result

# 3. Local sandboxed code execution (Unix only)

def set_limits():
    # Set CPU time limit (seconds)
    resource.setrlimit(resource.RLIMIT_CPU, (2, 2))
    # Set memory limit (bytes)
    resource.setrlimit(resource.RLIMIT_AS, (256 * 1024 * 1024, 256 * 1024 * 1024))  # 256MB

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
            preexec_fn=set_limits  # Only works on Unix
        )
        return result.stdout.decode(), result.stderr.decode()
    except subprocess.TimeoutExpired:
        return "", "Time Limit Exceeded"
    except Exception as e:
        return "", str(e)

# You can now use verify_with_model for LLM-based checking, and run_user_code for local execution. 