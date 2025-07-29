import sys
import subprocess
import json
import os
from services.ai_service import ask_gemma
from typing import Dict, List, Any

# Path to data files
DATA_DIR = os.path.join(os.path.dirname(__file__), '../data')
CHALLENGES_FILE = os.path.join(DATA_DIR, 'challenges.json')
PROGRESS_FILE = os.path.join(DATA_DIR, 'progress.json')

def load_challenges() -> List[Dict[str, Any]]:
    """Load challenges from JSON file"""
    if not os.path.exists(CHALLENGES_FILE):
        return []
    with open(CHALLENGES_FILE, 'r') as f:
        return json.load(f)

def save_challenges(challenges: List[Dict[str, Any]]):
    """Save challenges to JSON file"""
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(CHALLENGES_FILE, 'w') as f:
        json.dump(challenges, f, indent=2)

def load_progress() -> Dict[str, Any]:
    """Load user progress from JSON file"""
    if not os.path.exists(PROGRESS_FILE):
        return {}
    with open(PROGRESS_FILE, 'r') as f:
        return json.load(f)

def save_progress(progress: Dict[str, Any]):
    """Save user progress to JSON file"""
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(progress, f, indent=2)

def collect_ai_response(generator) -> str:
    """Collect all chunks from the AI generator into a single string"""
    response = ""
    for chunk in generator:
        response += chunk
    return response

def generate_challenge(difficulty: str = "easy", topic: str = "algorithms", language: str = "python") -> Dict[str, Any]:
    """
    Generate a new coding challenge using the AI model
    """
    prompt = f"""
Generate a coding challenge with the following specifications:
- Difficulty: {difficulty}
- Topic: {topic}
- Language: {language}

Return a JSON object with the following structure:
{{
    "title": "Challenge title",
    "description": "Detailed problem description",
    "difficulty": "{difficulty}",
    "language": "{language}",
    "topic": "{topic}",
    "xpReward": <number between 30-100 based on difficulty>,
    "input_format": "Description of input format",
    "output_format": "Description of output format",
    "template": "Code template for the user to start with",
    "examples": [
        {{
            "input": <input value>,
            "output": <expected output>
        }}
    ],
    "hints": [
        "Hint 1",
        "Hint 2",
        "Hint 3"
    ]
}}

Make sure the challenge is appropriate for the specified difficulty level and includes clear examples.
"""
    
    try:
        response = collect_ai_response(ask_gemma(prompt))
        # Try to extract JSON from the response
        start_idx = response.find('{')
        end_idx = response.rfind('}') + 1
        if start_idx != -1 and end_idx != 0:
            json_str = response[start_idx:end_idx]
            challenge = json.loads(json_str)
            
            # Add an ID
            challenges = load_challenges()
            challenge['id'] = max([c.get('id', 0) for c in challenges], default=0) + 1
            
            # Validate required fields
            required_fields = ['title', 'description', 'difficulty', 'language', 'topic', 'xpReward', 'input_format', 'output_format', 'template', 'examples', 'hints']
            for field in required_fields:
                if field not in challenge:
                    raise ValueError(f"Missing required field: {field}")
            
            return challenge
        else:
            raise ValueError("No JSON found in response")
    except Exception as e:
        # Return a fallback challenge if AI generation fails
        return {
            "id": len(load_challenges()) + 1,
            "title": f"Sample {difficulty.title()} Challenge",
            "description": f"This is a sample {difficulty} challenge about {topic}.",
            "difficulty": difficulty,
            "language": language,
            "topic": topic,
            "xpReward": 50 if difficulty == "easy" else 75 if difficulty == "medium" else 100,
            "input_format": "Input format description",
            "output_format": "Output format description",
            "template": f"def solve_problem(input_data):\n    # Write your solution here\n    pass",
            "examples": [
                {"input": "sample_input", "output": "sample_output"}
            ],
            "hints": [
                "Think about the problem step by step",
                "Consider edge cases",
                "Test your solution with the examples"
            ]
        }

def format_verification_prompt(problem: Dict[str, Any], user_code: str, test_cases: List[Dict[str, Any]]) -> str:
    """
    Build a prompt for the model to verify user code against the problem and test cases.
    """
    prompt = f"""
You are an expert coding tutor and code evaluator. Your job is to strictly evaluate the user's code against the given problem and test cases.

IMPORTANT EVALUATION RULES:
1. If the code is empty, incomplete, or contains only placeholder text (like "pass" or comments), mark ALL tests as FAILED
2. The code must be a complete, runnable solution that handles all test cases
3. Check that the function signature matches the expected input/output format
4. Verify that the code would produce the correct output for each test case
5. Be strict - only mark tests as PASSED if the code would actually work correctly

Return a JSON object with these fields:
- 'correct': true or false (whether ALL test cases pass)
- 'feedback': a short explanation or suggestion for the user
- 'test_results': array of test results with 'input', 'expected_output', 'actual_output', 'pass' fields

Problem: {problem['description']}
Input Format: {problem['input_format']}
Output Format: {problem['output_format']}
Test Cases: {json.dumps(test_cases, indent=2)}

User Code:
{user_code}

Analyze the code carefully and return the JSON response. If the code is incomplete or empty, mark all tests as failed.
"""
    return prompt

def verify_with_model(problem: Dict[str, Any], user_code: str, test_cases: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Use the AI model to verify user code against the problem and test cases.
    Returns a dict with 'correct', 'feedback', and 'test_results'.
    """
    # For now, always use execution-based verification for more reliable results
    # The AI model was not being strict enough with incomplete code
    return verify_with_execution(problem, user_code, test_cases)

def verify_with_execution(problem: Dict[str, Any], user_code: str, test_cases: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Fallback verification method that actually executes the user code.
    """
    test_results = []
    all_passed = True
    
    for i, test_case in enumerate(test_cases):
        try:
            # Prepare input data
            input_data = test_case['input']
            expected_output = test_case['output']  # Changed from 'expected_output' to 'output'
            
            # Execute the code
            stdout, stderr = run_user_code(user_code, input_data)
            
            # Clean up output
            actual_output = stdout.strip() if stdout else ""
            
            # Check if output matches expected
            passed = actual_output == expected_output
            
            test_results.append({
                'input': input_data,
                'expected_output': expected_output,
                'actual_output': actual_output,
                'pass': passed
            })
            
            if not passed:
                all_passed = False
                
        except Exception as e:
            test_results.append({
                'input': test_case['input'],
                'expected_output': test_case['output'],  # Changed from 'expected_output' to 'output'
                'actual_output': f"Error: {str(e)}",
                'pass': False
            })
            all_passed = False
    
    return {
        'correct': all_passed,
        'feedback': 'Code execution verification completed.',
        'test_results': test_results
    }

def run_user_code(code: str, input_data: str) -> tuple[str, str]:
    """
    Run user code in a subprocess for isolation.
    Returns (stdout, stderr).
    """
    try:
        result = subprocess.run(
            [sys.executable, "-c", code],
            input=input_data.encode(),
            capture_output=True,
            timeout=5,  # Increased timeout for more complex solutions
        )
        return result.stdout.decode(), result.stderr.decode()
    except subprocess.TimeoutExpired:
        return "", "Time Limit Exceeded"
    except Exception as e:
        return "", str(e)

def get_solution(problem: Dict[str, Any]) -> str:
    """
    Generate a solution for the given problem using the AI model.
    """
    prompt = f"""
You are an expert programming tutor. Provide a clean, idiomatic solution in {problem['language']} for the following problem:

Title: {problem['title']}
Description: {problem['description']}
Input Format: {problem['input_format']}
Output Format: {problem['output_format']}

Provide a complete solution with explanation. Format your response as:
```{problem['language']}
# Your solution code here
```

Explanation:
Your explanation here
"""
    
    try:
        response = collect_ai_response(ask_gemma(prompt))
        return response
    except Exception as e:
        return f"Error generating solution: {str(e)}"

def get_hints(problem: Dict[str, Any]) -> str:
    """
    Generate hints for the given problem using the AI model.
    """
    prompt = f"""
You are an expert programming tutor. Provide 3 helpful hints for solving the following problem. Do not give away the full solution.

Title: {problem['title']}
Description: {problem['description']}
Input Format: {problem['input_format']}
Output Format: {problem['output_format']}

Provide 3 progressive hints that guide the user toward the solution without revealing it completely.
"""
    
    try:
        response = collect_ai_response(ask_gemma(prompt))
        return response
    except Exception as e:
        return f"Error generating hints: {str(e)}"

def get_congrats_feedback(challenge_title: str, user_code: str) -> str:
    """
    Generate congratulatory feedback when user solves a challenge.
    """
    prompt = f"""
You are an expert coding tutor. The user has just solved the following challenge:

Title: {challenge_title}

Here is their solution:
{user_code}

Congratulate the user, and provide a brief, constructive review of their code style, efficiency, and any suggestions for improvement. Be positive and encouraging!
"""
    
    try:
        response = collect_ai_response(ask_gemma(prompt))
        return response
    except Exception as e:
        return "Great job solving this challenge! Keep up the excellent work!"

def update_user_progress(user_id: str, challenge_id: int, xp_earned: int):
    """
    Update user progress when they complete a challenge.
    """
    progress = load_progress()
    
    if user_id not in progress:
        progress[user_id] = {
            'total_xp': 0,
            'completed_challenges': [],
            'level': 1
        }
    
    # Add XP
    progress[user_id]['total_xp'] += xp_earned
    
    # Add challenge to completed list if not already there
    if challenge_id not in progress[user_id]['completed_challenges']:
        progress[user_id]['completed_challenges'].append(challenge_id)
    
    # Calculate level (every 100 XP = 1 level)
    progress[user_id]['level'] = (progress[user_id]['total_xp'] // 100) + 1
    
    save_progress(progress)
    return progress[user_id]

def get_user_progress(user_id: str) -> Dict[str, Any]:
    """
    Get user progress information.
    """
    progress = load_progress()
    return progress.get(user_id, {
        'total_xp': 0,
        'completed_challenges': [],
        'level': 1
    }) 