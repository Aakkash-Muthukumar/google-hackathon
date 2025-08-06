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
    """Load challenges from JSON file and update completion status based on user progress"""
    if not os.path.exists(CHALLENGES_FILE):
        return []
    with open(CHALLENGES_FILE, 'r') as f:
        challenges = json.load(f)
    
    # Clean up any duplicates before processing
    challenges = _remove_duplicate_challenges(challenges)
    
    # Update completion status based on user progress
    return update_challenge_completion_status(challenges)

def _remove_duplicate_challenges(challenges: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Remove duplicate challenges based on title and description similarity.
    Keeps the first occurrence and removes subsequent duplicates.
    """
    seen_titles = set()
    seen_descriptions = set()
    unique_challenges = []
    
    for challenge in challenges:
        title_lower = challenge.get('title', '').lower()
        description_lower = challenge.get('description', '').lower()
        
        # Check if title already exists
        if title_lower in seen_titles:
            continue
        
        # Check if description is too similar to existing ones
        is_duplicate = False
        for existing_desc in seen_descriptions:
            if _calculate_similarity(description_lower, existing_desc) > 0.8:
                is_duplicate = True
                break
        
        if is_duplicate:
            continue
        
        # Add to unique challenges
        seen_titles.add(title_lower)
        seen_descriptions.add(description_lower)
        unique_challenges.append(challenge)
    
    # If we removed duplicates, save the cleaned data
    if len(unique_challenges) < len(challenges):
        save_challenges(unique_challenges)
        print(f"Removed {len(challenges) - len(unique_challenges)} duplicate challenges")
    
    return unique_challenges

def update_challenge_completion_status(challenges: List[Dict[str, Any]], user_id: str = "default_user") -> List[Dict[str, Any]]:
    """Update the completed attribute for all challenges based on user progress"""
    try:
        progress = load_progress()
        user_progress = progress.get(user_id, {
            'completed_challenges': []
        })
        completed_challenge_ids = set(user_progress.get('completed_challenges', []))
        
        # Update each challenge's completed status based on user progress
        for challenge in challenges:
            challenge['completed'] = challenge.get('id') in completed_challenge_ids
        
        return challenges
    except Exception as e:
        print(f"Error updating challenge completion status: {e}")
        # Return challenges with default completed=False if there's an error
        for challenge in challenges:
            challenge['completed'] = False
        return challenges

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
    existing_descriptions = [challenge.get('description', '').lower() for challenge in existing_challenges]
    
    # Create a more specific prompt to avoid similar challenges
    similar_challenges = []
    for title in existing_titles:
        if any(keyword in title for keyword in ['largest', 'find', 'number', 'list', 'palindrome', 'string', 'sort', 'algorithm']):
            similar_challenges.append(title)
    
    prompt = f"""
Generate a coding challenge with the following specifications:
- **Difficulty:** {difficulty}
- **Topic:** {topic}
- **Language:** {language}

**IMPORTANT:** Do NOT generate any of these existing challenges or anything too similar:
{', '.join(existing_titles)}

**Especially avoid these types of challenges that already exist:**
{', '.join(similar_challenges)}

Generate a completely different and unique challenge. Be creative and avoid common patterns like:
- Finding largest/smallest numbers in lists
- Palindrome checks
- Basic sorting algorithms
- Simple string manipulations

**Instead, consider challenges like:**
- Array manipulation with specific conditions
- Mathematical sequences or patterns
- Data structure operations
- Algorithmic puzzles
- String processing with complex rules
- Number theory problems
- Recursive patterns
- Optimization problems

**CRITICAL:** The template should ONLY contain:
- Function signature with proper parameters
- Docstring explaining the function
- Placeholder comment like "# Your code here" or "pass"
- NO complete solution or implementation
- NO working code - only the function signature and docstring

**Return a JSON object with the following structure:**
```json
{{
    "title": "Challenge title",
    "description": "Detailed problem description",
    "difficulty": "{difficulty}",
    "language": "{language}",
    "topic": "{topic}",
    "xpReward": <number between 30-100 based on difficulty>,
    "input_format": "Description of input format",
    "output_format": "Description of output format",
    "template": "def function_name(params):\\n    \"\"\"Docstring\"\"\"\\n    # Your code here\\n    pass",
    "examples": [
        {{
            "input": <input value>,
            "output": <expected output>
        }}
    ]
}}
```

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
            
            # Check for duplicates by title AND description
            challenge_title_lower = challenge.get('title', '').lower()
            challenge_description_lower = challenge.get('description', '').lower()
            
            # Check if title already exists
            if challenge_title_lower in existing_titles:
                raise ValueError(f"Challenge with title '{challenge.get('title')}' already exists")
            
            # Check if description already exists (allowing for minor variations)
            for existing_desc in existing_descriptions:
                # If descriptions are very similar (80% similarity), consider it a duplicate
                if _calculate_similarity(challenge_description_lower, existing_desc) > 0.8:
                    raise ValueError(f"Challenge with similar description already exists")
            
            # Add an ID
            challenge['id'] = max([c.get('id', 0) for c in existing_challenges], default=0) + 1
            
            # Add completed attribute
            challenge['completed'] = False
            
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
        return _generate_fallback_challenge(difficulty, topic, language, existing_challenges)

def _calculate_similarity(text1: str, text2: str) -> float:
    """
    Calculate similarity between two texts using simple word overlap.
    Returns a value between 0 and 1, where 1 means identical.
    """
    words1 = set(text1.lower().split())
    words2 = set(text2.lower().split())
    
    if not words1 or not words2:
        return 0.0
    
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    
    return len(intersection) / len(union)

def _generate_fallback_challenge(difficulty: str, topic: str, language: str, existing_challenges: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Generate a fallback challenge when AI generation fails.
    Creates unique challenges based on difficulty and topic.
    """
    # Create a variety of fallback challenges based on topic and difficulty
    fallback_challenges = {
        "algorithms": {
            "easy": {
                "title": "Array Rotation",
                "description": "Given an array of integers and a rotation count, rotate the array to the right by the specified number of positions. For example, rotating [1, 2, 3, 4, 5] by 2 positions results in [4, 5, 1, 2, 3].",
                "template": "def rotate_array(arr, k):\n    \"\"\"Rotates the array to the right by k positions.\"\"\"\n    # Your code here\n    pass",
                "examples": [
                    {"input": "[1, 2, 3, 4, 5], 2", "output": "[4, 5, 1, 2, 3]"},
                    {"input": "[1, 2, 3], 1", "output": "[3, 1, 2]"}
                ]
            },
            "medium": {
                "title": "Binary Search Tree Validation",
                "description": "Given a binary tree, determine if it is a valid binary search tree (BST). A BST is valid if for every node, all nodes in its left subtree have values less than the node's value, and all nodes in its right subtree have values greater than the node's value.",
                "template": "def is_valid_bst(root):\n    \"\"\"Checks if the binary tree is a valid BST.\"\"\"\n    # Your code here\n    pass",
                "examples": [
                    {"input": "TreeNode(2, TreeNode(1), TreeNode(3))", "output": "True"},
                    {"input": "TreeNode(5, TreeNode(1), TreeNode(4, TreeNode(3), TreeNode(6)))", "output": "False"}
                ]
            },
            "hard": {
                "title": "Longest Increasing Subsequence",
                "description": "Given an array of integers, find the length of the longest strictly increasing subsequence. A subsequence is a sequence that can be derived from the array by deleting some or no elements without changing the order of the remaining elements.",
                "template": "def length_of_lis(nums):\n    \"\"\"Returns the length of the longest increasing subsequence.\"\"\"\n    # Your code here\n    pass",
                "examples": [
                    {"input": "[10, 9, 2, 5, 3, 7, 101, 18]", "output": "4"},
                    {"input": "[0, 1, 0, 3, 2, 3]", "output": "4"}
                ]
            }
        },
        "strings": {
            "easy": {
                "title": "String Compression",
                "description": "Given a string, compress it by replacing consecutive repeated characters with the character followed by the count. If the compressed string is longer than the original, return the original string.",
                "template": "def compress_string(s):\n    \"\"\"Compresses a string by counting consecutive characters.\"\"\"\n    # Your code here\n    pass",
                "examples": [
                    {"input": "aabcccccaaa", "output": "a2b1c5a3"},
                    {"input": "abcd", "output": "abcd"}
                ]
            },
            "medium": {
                "title": "Longest Palindromic Substring",
                "description": "Given a string, find the longest palindromic substring. A palindrome is a string that reads the same backward as forward.",
                "template": "def longest_palindrome(s):\n    \"\"\"Returns the longest palindromic substring.\"\"\"\n    # Your code here\n    pass",
                "examples": [
                    {"input": "babad", "output": "bab"},
                    {"input": "cbbd", "output": "bb"}
                ]
            },
            "hard": {
                "title": "Regular Expression Matching",
                "description": "Implement regular expression matching with support for '.' and '*'. '.' matches any single character, '*' matches zero or more of the preceding element.",
                "template": "def is_match(s, p):\n    \"\"\"Checks if string s matches pattern p.\"\"\"\n    # Your code here\n    pass",
                "examples": [
                    {"input": "aa, a", "output": "False"},
                    {"input": "aa, a*", "output": "True"}
                ]
            }
        },
        "math": {
            "easy": {
                "title": "Perfect Square Check",
                "description": "Given a positive integer, determine if it is a perfect square. A perfect square is an integer that is the square of an integer.",
                "template": "def is_perfect_square(num):\n    \"\"\"Checks if the number is a perfect square.\"\"\"\n    # Your code here\n    pass",
                "examples": [
                    {"input": "16", "output": "True"},
                    {"input": "14", "output": "False"}
                ]
            },
            "medium": {
                "title": "Integer to Roman",
                "description": "Convert an integer to a Roman numeral. Roman numerals are represented by seven different symbols: I, V, X, L, C, D, and M.",
                "template": "def int_to_roman(num):\n    \"\"\"Converts an integer to Roman numeral.\"\"\"\n    # Your code here\n    pass",
                "examples": [
                    {"input": "3", "output": "III"},
                    {"input": "58", "output": "LVIII"}
                ]
            },
            "hard": {
                "title": "Trailing Zeroes in Factorial",
                "description": "Given an integer n, return the number of trailing zeroes in n! (n factorial).",
                "template": "def trailing_zeroes(n):\n    \"\"\"Returns the number of trailing zeroes in n!.\"\"\"\n    # Your code here\n    pass",
                "examples": [
                    {"input": "3", "output": "0"},
                    {"input": "5", "output": "1"}
                ]
            }
        },
        "graphs": {
            "easy": {
                "title": "Number of Islands",
                "description": "Given a 2D grid map of '1's (land) and '0's (water), count the number of islands. An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.",
                "template": "def num_islands(grid):\n    \"\"\"Counts the number of islands in the grid.\"\"\"\n    # Your code here\n    pass",
                "examples": [
                    {"input": "[['1','1','0','0','0'], ['1','1','0','0','0'], ['0','0','1','0','0'], ['0','0','0','1','1']]", "output": "3"}
                ]
            },
            "medium": {
                "title": "Course Schedule",
                "description": "Given the total number of courses and a list of prerequisite pairs, determine if it is possible to finish all courses.",
                "template": "def can_finish(num_courses, prerequisites):\n    \"\"\"Checks if all courses can be finished.\"\"\"\n    # Your code here\n    pass",
                "examples": [
                    {"input": "2, [[1,0]]", "output": "True"},
                    {"input": "2, [[1,0],[0,1]]", "output": "False"}
                ]
            },
            "hard": {
                "title": "Word Ladder",
                "description": "Given two words and a dictionary, find the length of shortest transformation sequence from beginWord to endWord.",
                "template": "def ladder_length(begin_word, end_word, word_list):\n    \"\"\"Returns the length of shortest transformation sequence.\"\"\"\n    # Your code here\n    pass",
                "examples": [
                    {"input": "hit, cog, [hot,dot,dog,lot,log,cog]", "output": "5"}
                ]
            }
        }
    }
    
    # Get the appropriate fallback challenge
    topic_challenges = fallback_challenges.get(topic, fallback_challenges["algorithms"])
    difficulty_challenge = topic_challenges.get(difficulty, topic_challenges["easy"])
    
    # Check if this fallback challenge already exists
    existing_titles = [c.get('title', '').lower() for c in existing_challenges]
    if difficulty_challenge["title"].lower() in existing_titles:
        # If the fallback also exists, create a completely different challenge
        return {
            "id": max([c.get('id', 0) for c in existing_challenges], default=0) + 1,
            "title": f"Unique {topic.title()} Challenge",
            "description": f"Create a unique {difficulty} level challenge related to {topic}. This is a placeholder challenge that should be replaced by AI generation.",
            "difficulty": difficulty,
            "language": language,
            "topic": topic,
            "xpReward": 50 if difficulty == "easy" else 75 if difficulty == "medium" else 100,
            "input_format": "Varies based on the specific challenge",
            "output_format": "Varies based on the specific challenge",
            "template": f"def solve_{topic.lower()}_challenge():\n    \"\"\"Solves a {difficulty} level {topic} challenge.\"\"\"\n    # Your code here\n    pass",
            "examples": [
                {"input": "example_input", "output": "example_output"}
            ],
            "completed": False
        }
    
    return {
        "id": max([c.get('id', 0) for c in existing_challenges], default=0) + 1,
        "title": difficulty_challenge["title"],
        "description": difficulty_challenge["description"],
        "difficulty": difficulty,
        "language": language,
        "topic": topic,
        "xpReward": 50 if difficulty == "easy" else 75 if difficulty == "medium" else 100,
        "input_format": "Varies based on the specific challenge",
        "output_format": "Varies based on the specific challenge",
        "template": difficulty_challenge["template"],
        "examples": difficulty_challenge["examples"],
        "completed": False
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
You are an expert programming tutor. Provide a clean, idiomatic, and CORRECT solution in {problem['language']} for the following problem.

**CRITICAL REQUIREMENTS:**
- The solution MUST pass all test cases exactly
- The solution MUST be complete and runnable
- The solution MUST handle edge cases properly
- The solution MUST be efficient and well-structured
- The solution MUST return the exact output format specified

**PROBLEM DETAILS:**
- **Title:** {problem['title']}
- **Description:** {problem['description']}
- **Input Format:** {problem['input_format']}
- **Output Format:** {problem['output_format']}

**TEST CASES:**
```json
{json.dumps(problem.get('examples', []), indent=2)}
```

**INSTRUCTIONS:**
1. Analyze the problem carefully and understand the requirements
2. Write a complete, working solution that handles ALL test cases
3. Ensure the solution returns the EXACT expected output format (string, int, list, etc.)
4. Test your logic step-by-step against each provided test case
5. Include proper error handling and edge cases
6. Make sure the solution is efficient and readable
7. Double-check that your solution matches the expected outputs exactly

**RESPONSE FORMAT:**
```{problem['language']}
# Complete solution code here
```

**EXPLANATION:**
Provide a clear explanation of your approach, why it works, and how it handles the test cases.

**IMPORTANT:** Your solution must be able to pass verification against ALL the test cases provided. Pay special attention to the exact output format expected.
"""
    
    try:
        response = collect_ai_response(ask_gemma(prompt))
        return response
    except Exception as e:
        return f"Error generating solution: {str(e)}"

def get_hints(problem: Dict[str, Any]) -> str:
    """
    Generate hints for the given problem using the AI model.
    Returns a structured response with 3 progressive hints.
    """
    prompt = f"""
You are an expert programming tutor. Provide 3 progressive hints for solving the following problem. Do not give away the full solution.

**PROBLEM DETAILS:**
- **Title:** {problem['title']}
- **Description:** {problem['description']}
- **Input Format:** {problem['input_format']}
- **Output Format:** {problem['output_format']}

Provide exactly 3 progressive hints that guide the user toward the solution without revealing it completely.

**IMPORTANT:** Format your response exactly like this:

**HINT 1:** [First hint here]

**HINT 2:** [Second hint here]

**HINT 3:** [Third hint here]

Make sure each hint builds upon the previous one and helps the user understand the problem better.
"""
    
    try:
        response = collect_ai_response(ask_gemma(prompt))
        return response
    except Exception as e:
        return f"HINT 1: Start by understanding the problem requirements.\nHINT 2: Break down the problem into smaller steps.\nHINT 3: Consider the edge cases and test your solution."

def get_single_hint(problem: Dict[str, Any], hint_number: int) -> str:
    """
    Generate a single hint for the given problem using the AI model.
    Returns only the requested hint number (1, 2, or 3).
    """
    if hint_number < 1 or hint_number > 3:
        raise ValueError("Hint number must be 1, 2, or 3")
    
    # Create context-aware prompts for each hint
    if hint_number == 1:
        prompt = f"""
You are an expert programming tutor. Provide the FIRST hint for solving the following problem. This should be a gentle nudge to get the user started.

**PROBLEM DETAILS:**
- **Title:** {problem['title']}
- **Description:** {problem['description']}
- **Input Format:** {problem['input_format']}
- **Output Format:** {problem['output_format']}

Provide ONLY the first hint that helps the user understand the problem and get started. Do not give away the solution or provide multiple hints.

**IMPORTANT:** Return ONLY the hint text, no formatting or numbering.
"""
    elif hint_number == 2:
        prompt = f"""
You are an expert programming tutor. Provide the SECOND hint for solving the following problem. This should build upon the first hint and provide more specific guidance.

**PROBLEM DETAILS:**
- **Title:** {problem['title']}
- **Description:** {problem['description']}
- **Input Format:** {problem['input_format']}
- **Output Format:** {problem['output_format']}

Provide ONLY the second hint that gives more specific guidance toward the solution. This should be more detailed than the first hint but still not reveal the complete solution.

**IMPORTANT:** Return ONLY the hint text, no formatting or numbering.
"""
    else:  # hint_number == 3
        prompt = f"""
You are an expert programming tutor. Provide the THIRD and final hint for solving the following problem. This should be the most specific hint that almost reveals the solution.

**PROBLEM DETAILS:**
- **Title:** {problem['title']}
- **Description:** {problem['description']}
- **Input Format:** {problem['input_format']}
- **Output Format:** {problem['output_format']}

Provide ONLY the third hint that gives very specific guidance toward the solution. This should be the most detailed hint that almost reveals the complete solution.

**IMPORTANT:** Return ONLY the hint text, no formatting or numbering.
"""
    
    try:
        response = collect_ai_response(ask_gemma(prompt))
        # Clean up the response - remove any TLDR sections and extra formatting
        cleaned_response = response.strip()
        
        # Remove TLDR section if present
        if '**TLDR:**' in cleaned_response:
            cleaned_response = cleaned_response.split('**TLDR:**')[0].strip()
        elif 'TLDR:' in cleaned_response:
            cleaned_response = cleaned_response.split('TLDR:')[0].strip()
        
        # Remove any extra newlines and formatting
        cleaned_response = '\n'.join(line.strip() for line in cleaned_response.split('\n') if line.strip())
        
        return cleaned_response
    except Exception as e:
        # Fallback hints
        fallback_hints = [
            "Start by understanding the problem requirements and what the function should return.",
            "Break down the problem into smaller steps and consider the data structures you might need.",
            "Consider the edge cases and test your solution with different inputs to ensure it works correctly."
        ]
        return fallback_hints[hint_number - 1]

def get_congrats_feedback(challenge_title: str, user_code: str) -> str:
    """
    Generate congratulatory feedback when user solves a challenge.
    """
    prompt = f"""
You are an expert coding tutor. The user has just solved the following challenge:

**Challenge Title:** {challenge_title}

**User's Solution:**
```python
{user_code}
```

Congratulate the user, and provide a brief, constructive review of their code style, efficiency, and any suggestions for improvement. Be positive and encouraging!

**Format your response with:**
- **Congratulations** section
- **Code Review** section with specific feedback
- **Suggestions** for improvement (if any)
- **Overall Assessment** of their solution
"""
    
    try:
        response = collect_ai_response(ask_gemma(prompt))
        return response
    except Exception as e:
        return "Great job solving this challenge! Keep up the excellent work!"

def update_user_progress(user_id: str, challenge_id: int, xp_earned: int, challenge_data: Dict[str, Any] = None):
    """
    Update user progress when they complete a challenge.
    """
    from .achievement_service import update_achievement_progress, update_streak, calculate_level
    
    progress = load_progress()
    
    if user_id not in progress:
        progress[user_id] = {
            'total_xp': 0,
            'completed_challenges': [],
            'level': 1,
            'streak': 0,
            'longest_streak': 0,
            'last_active_date': '',
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
    
    # Update streak first
    user_progress = update_streak(user_id)
    
    # Add XP
    user_progress['total_xp'] += xp_earned
    
    # Add challenge to completed list if not already there
    if challenge_id not in user_progress['completed_challenges']:
        user_progress['completed_challenges'].append(challenge_id)
    
    # Update achievement progress
    additional_data = {}
    if challenge_data:
        additional_data = {
            'topic': challenge_data.get('topic', ''),
            'difficulty': challenge_data.get('difficulty', '')
        }
    
    achievement_result = update_achievement_progress(
        user_id, 
        'challenge_completed', 
        1, 
        additional_data
    )
    
    # Recalculate level with new XP
    user_progress['level'] = calculate_level(user_progress['total_xp'])
    
    # Update progress in main progress dict
    progress[user_id] = user_progress
    save_progress(progress)
    
    return {
        'progress': user_progress,
        'new_achievements': achievement_result['new_achievements'],
        'achievement_xp_earned': achievement_result['xp_earned'],
        'total_xp_earned': xp_earned + achievement_result['xp_earned']
    }

def mark_challenge_completed(challenge_id: int) -> bool:
    """
    Mark a challenge as completed in the user's progress.
    Note: We don't modify the challenges.json file anymore, only the user's progress.
    """
    try:
        # This function is now deprecated in favor of update_user_progress
        # which handles both XP and completion tracking
        print(f"Challenge {challenge_id} completion is now handled by update_user_progress")
        return True
    except Exception as e:
        print(f"Error marking challenge as completed: {e}")
        return False

def reset_completed_challenges() -> bool:
    """
    Reset all challenges to not completed when challenges.json is deleted and recreated.
    """
    try:
        progress = load_progress()
        # Reset completed challenges for all users
        for user_id in progress:
            if 'completed_challenges' in progress[user_id]:
                progress[user_id]['completed_challenges'] = []
        save_progress(progress)
        return True
    except Exception as e:
        print(f"Error resetting completed challenges: {e}")
        return False

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