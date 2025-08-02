import time
from ollama import chat

MODEL = "gemma3n"

def ask_gemma(prompt: str):
    response = chat(
        model=MODEL,
        messages=[
            {"role": "system", "content": (
                "You are a highly skilled and friendly programming tutor. "
                "You help students understand programming concepts clearly. "
                "You are well-versed in Python, JavaScript, C++, and Java. "
                "When creating lesson content, always structure it into 4 equal parts "
                "with progress breakpoints at 25%, 50%, 75%, and 100% completion."
            )},
            {"role": "user", "content": prompt}
        ],
        stream=True
    )
    for chunk in response:
        if chunk and isinstance(chunk, dict):
            content = chunk.get("message", {}).get("content", "")
            if content:
                yield content

def generate_lesson_content(lesson_title: str, lesson_description: str, programming_language: str, difficulty: str = "beginner"):
    """
    Generate comprehensive lesson content using AI with progress breakpoints
    """
    prompt = f"""
    Create a comprehensive programming lesson with the following details:
    
    Lesson Title: {lesson_title}
    Lesson Description: {lesson_description}
    Programming Language: {programming_language}
    Difficulty Level: {difficulty}
    
    IMPORTANT: Structure the lesson content into 4 equal parts with clear progress breakpoints:
    
    **PART 1 (0-25%): Introduction and Basic Concepts**
    - Brief overview of what will be covered
    - Basic definitions and fundamental concepts
    - Simple examples to introduce the topic
    
    **PART 2 (25-50%): Detailed Explanation**
    - In-depth explanation of the concept with clear examples
    - More detailed code examples
    - Step-by-step breakdown of concepts
    
    **PART 3 (50-75%): Advanced Examples and Practice**
    - Multiple practical code examples demonstrating the concept
    - Intermediate-level examples
    - Common use cases and scenarios
    
    **PART 4 (75-100%): Exercises and Summary**
    - 2-3 hands-on exercises for students to practice
    - Key takeaways and summary of important points
    - Common mistakes and how to avoid them
    - Further reading suggestions
    
    At the end of each part, include a clear progress marker:
    - After Part 1: "## 🎯 25% Content Complete"
    - After Part 2: "## 🎯 50% Content Complete" 
    - After Part 3: "## 🎯 75% Content Complete"
    - At the end: "## 🎯 100% Content Complete"
    
    Make the content engaging, beginner-friendly, and include plenty of code examples.
    Use markdown formatting for better readability.
    Keep the total content between 1000-2000 words.
    Ensure each part is roughly equal in length and content depth.
    """
    
    try:
        # Use non-streaming version for lesson generation
        response = chat(
            model=MODEL,
            messages=[
                {"role": "system", "content": (
                    "You are an expert programming instructor who creates engaging, "
                    "comprehensive lesson content with clear progress tracking. You excel at "
                    "explaining complex concepts in simple terms and providing practical code examples. "
                    "Always use markdown formatting and structure content into 4 equal parts with "
                    "progress breakpoints at 25%, 50%, 75%, and 100%. Each part should be "
                    "roughly equal in length and build upon the previous sections."
                )},
                {"role": "user", "content": prompt}
            ],
            stream=False
        )
        
        if response and isinstance(response, dict):
            return response.get("message", {}).get("content", "")
        else:
            return "Failed to generate lesson content. Please try again."
            
    except Exception as e:
        print(f"Error generating lesson content: {e}")
        return f"Error generating lesson content: {str(e)}" 