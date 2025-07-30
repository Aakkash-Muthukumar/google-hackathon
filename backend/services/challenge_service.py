import sys
import json
import os
from services.ai_service import ask_gemma
from services.verification_service import verify_code_with_ai
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
        if isinstance(chunk, str):
            response += chunk
        else:
            # Handle case where chunk might be a dict (fallback)
            response += str(chunk)
    return response

def generate_challenge(difficulty: str = "easy", topic: str = "algorithms", language: str = "python") -> Dict[str, Any]:
    """
    Generate a new coding challenge using the AI model
    """
    # Load existing challenges to prevent duplicates
    existing_challenges = load_challenges()
    existing_titles = [challenge.get('title', '').lower() for challenge in existing_challenges]
    
    # Create a more specific prompt to avoid similar challenges
    similar_challenges = []
    for title in existing_titles:
        if any(keyword in title for keyword in ['largest', 'find', 'number', 'list', 'palindrome', 'string', 'sort', 'algorithm']):
            similar_challenges.append(title)
    
    prompt = f"""
Generate a coding challenge with the following specifications:
- Difficulty: {difficulty}
- Topic: {topic}
- Language: {language}

IMPORTANT: Do NOT generate any of these existing challenges or anything too similar:
{', '.join(existing_titles)}

Especially avoid these types of challenges that already exist:
{', '.join(similar_challenges)}

Generate a completely different and unique challenge. Be creative and avoid common patterns like:
- Finding largest/smallest numbers in lists
- Palindrome checks
- Basic sorting algorithms
- Simple string manipulations

Instead, consider challenges like:
- Array manipulation with specific conditions
- Mathematical sequences or patterns
- Data structure operations
- Algorithmic puzzles
- String processing with complex rules
- Number theory problems
- Recursive patterns
- Optimization problems

CRITICAL: The template should ONLY contain:
- Function signature with proper parameters
- Docstring explaining the function
- Placeholder comment like "# Your code here" or "pass"
- NO complete solution or implementation
- NO working code - only the function signature and docstring

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
    "template": "def function_name(params):\n    \"\"\"Docstring\"\"\"\n    # Your code here\n    pass",
    "examples": [
        {{
            "input": <input value>,
            "output": <expected output>
        }}
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
            challenge['id'] = max([c.get('id', 0) for c in existing_challenges], default=0) + 1
            
            # Validate required fields
            required_fields = ['title', 'description', 'difficulty', 'language', 'topic', 'xpReward', 'input_format', 'output_format', 'template', 'examples']
            for field in required_fields:
                if field not in challenge:
                    raise ValueError(f"Missing required field: {field}")
            
            # Ensure template doesn't contain a complete solution
            template = challenge['template']
            if 'return ' in template and not template.strip().endswith('pass'):
                # If there's a return statement and it's not just "pass", it might be a solution
                lines = template.split('\n')
                code_lines = [line.strip() for line in lines if line.strip() and not line.strip().startswith('#') and not line.strip().startswith('"""') and not line.strip().startswith("'''")]
                if len(code_lines) > 3:  # More than just function signature and pass
                    # Replace with a proper template
                    function_name = code_lines[0].split('def ')[1].split('(')[0]
                    challenge['template'] = f"def {function_name}(grid):\n    \"\"\"Calculates the perimeter of the islands in a 2D grid.\"\"\"\n    # Your code here\n    pass"
            
            return challenge
        else:
            raise ValueError("No JSON found in response")
    except Exception as e:
        # Return a fallback challenge if AI generation fails
        return {
            "id": len(existing_challenges) + 1,
            "title": f"String Character Counter",
            "description": f"Write a function that counts the frequency of each character in a string and returns the character that appears most frequently. If there's a tie, return the character that appears first in the string.",
            "difficulty": difficulty,
            "language": language,
            "topic": topic,
            "xpReward": 50 if difficulty == "easy" else 75 if difficulty == "medium" else 100,
            "input_format": "A string containing alphanumeric characters",
            "output_format": "A single character (the most frequent one)",
            "template": f"def most_frequent_char(text):\n    \"\"\"Returns the most frequent character in the given string.\"\"\"\n    # Your code here\n    pass",
            "examples": [
                {"input": "hello", "output": "l"},
                {"input": "programming", "output": "g"},
                {"input": "aabbcc", "output": "a"}
            ],
            "hints": []  # Hints will be generated dynamically when requested
        }

def format_verification_prompt(problem: Dict[str, Any], user_code: str, test_cases: List[Dict[str, Any]]) -> str:
    """
    Build a prompt for the model to verify user code against the problem and test cases.
    """
    prompt = f"""
You are a code evaluator. Analyze the given code and test cases to determine if the code is correct.

Problem: {problem['description']}

User Code:
{user_code}

Test Cases:
{json.dumps(test_cases, indent=2)}

For each test case, determine:
1. What the code would output given the input
2. Whether that output matches the expected output

Return a JSON response with this exact structure:
{{
    "correct": true/false,
    "feedback": "brief explanation",
    "test_results": [
        {{
            "input": "input value",
            "expected_output": "expected output", 
            "actual_output": "what the code would produce",
            "pass": true/false
        }}
    ]
}}

Be strict. If the code is incomplete, has errors, or won't produce the expected output, mark it as failed.
"""
    return prompt

def verify_with_model(problem: Dict[str, Any], user_code: str, test_cases: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Use AI model to verify user code against the problem and test cases.
    Returns a dict with 'correct', 'feedback', and 'test_results'.
    """
    return verify_code_with_ai(problem, user_code, test_cases)

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