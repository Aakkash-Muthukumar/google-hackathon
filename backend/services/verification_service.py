import time
from ollama import chat
import json


VERIFICATION_MODEL = "gemma3n"
def collect_verification_response(generator) -> str:
    """Collect all chunks from the AI generator into a single string"""
    response = ""
    for chunk in generator:
        if isinstance(chunk, str):
            response += chunk
        else:
            # Handle case where chunk might be a dict (fallback)
            response += str(chunk)
    return response

def verify_code_with_ai(problem: dict, user_code: str, test_cases: list) -> dict:
    """
    Use AI model to verify user code against the problem and test cases.
    Returns a dict with 'correct', 'feedback', and 'test_results'.
    """
    # Pre-check: If code is clearly incomplete, don't even ask AI
    user_code_clean = user_code.strip()
    if (not user_code_clean or 
        user_code_clean.endswith('pass') or 
        '# Your code here' in user_code_clean or
        'return ' not in user_code_clean or
        len(user_code_clean.split('\n')) <= 5):
        return {
            'correct': False,
            'feedback': 'Code is incomplete. Please implement a complete solution.',
            'test_results': [{
                'input': str(test_case['input']),
                'expected_output': str(test_case['output']),
                'actual_output': 'Code incomplete',
                'pass': False
            } for test_case in test_cases]
        }
    
    prompt = f"""
You are an expert code evaluator. Carefully analyze the given code and test cases to determine if the code is correct.

PROBLEM DESCRIPTION:
{problem['description']}

USER CODE:
{user_code}

TEST CASES:
{json.dumps(test_cases, indent=2)}

INSTRUCTIONS:
1. Analyze the user's code for syntax errors, logic errors, and completeness
2. For each test case, determine what the code would output given the input
3. Compare the expected output with what the code would actually produce
4. Be strict but fair - if the code is incomplete, has errors, or won't produce the expected output, mark it as failed

RESPONSE FORMAT:
Return ONLY a valid JSON object with this exact structure:
{{
    "correct": true/false,
    "feedback": "brief explanation of why the code passed or failed",
    "test_results": [
        {{
            "input": "input value",
            "expected_output": "expected output", 
            "actual_output": "what the code would produce",
            "pass": true/false
        }}
    ]
}}

IMPORTANT: 
- Return ONLY the JSON object, no other text
- Be accurate in your analysis
- If the code has syntax errors or won't run, mark all tests as failed
- If the code is incomplete (has 'pass' or '# Your code here'), mark all tests as failed
- If the code is just a template with no implementation, mark all tests as failed
- Only mark as correct if the code actually implements a working solution
- Take your time to carefully analyze the code logic and test cases
- Be very strict - incomplete or template code should always fail
"""
    
    try:
        # Create a custom generator that extracts content from Ollama response
        def extract_content():
            ollama_response = chat(
                model=VERIFICATION_MODEL,
                messages=[
                    {"role": "system", "content": (
                        "You are an expert programming evaluator. You analyze code and determine if it correctly solves programming problems. "
                        "You are precise, thorough, and provide accurate assessments."
                    )},
                    {"role": "user", "content": prompt}
                ],
                stream=True
            )
            for chunk in ollama_response:
                if chunk and isinstance(chunk, dict):
                    content = chunk.get("message", {}).get("content", "")
                    if content:
                        yield content
        
        response = collect_verification_response(extract_content())
        
        # Try to extract JSON from the response
        start_idx = response.find('{')
        end_idx = response.rfind('}') + 1
        if start_idx != -1 and end_idx != 0:
            json_str = response[start_idx:end_idx]
            result = json.loads(json_str)
            
            # Validate the response structure
            if 'correct' not in result or 'test_results' not in result:
                return create_fallback_response(test_cases, "Invalid AI response structure")
            
            # Ensure feedback field exists
            if 'feedback' not in result:
                result['feedback'] = "Code verification completed."
            
            return result
        else:
            return create_fallback_response(test_cases, "No JSON found in AI response")
            
    except json.JSONDecodeError as e:
        return create_fallback_response(test_cases, f"JSON parsing error: {str(e)}")
    except Exception as e:
        return create_fallback_response(test_cases, f"AI verification error: {str(e)}")

def create_fallback_response(test_cases: list, error_message: str) -> dict:
    """Create a fallback response when AI verification fails"""
    return {
        'correct': False,
        'feedback': f'Verification failed: {error_message}',
        'test_results': [{
            'input': str(test_case['input']),
            'expected_output': str(test_case['output']),
            'actual_output': 'Verification error',
            'pass': False
        } for test_case in test_cases]
    } 