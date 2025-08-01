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
                "You are well-versed in Python, JavaScript, C++, and Java."
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
    Generate comprehensive lesson content using AI
    """
    prompt = f"""
    Create a comprehensive programming lesson with the following details:
    
    Lesson Title: {lesson_title}
    Lesson Description: {lesson_description}
    Programming Language: {programming_language}
    Difficulty Level: {difficulty}
    
    Please structure the lesson content with the following sections:
    
    1. **Introduction** - Brief overview of what will be covered
    2. **Detailed Explanation** - In-depth explanation of the concept with clear examples
    3. **Code Examples** - Multiple practical code examples demonstrating the concept
    4. **Practice Exercises** - 2-3 hands-on exercises for students to practice
    5. **Key Takeaways** - Summary of important points to remember
    6. **Common Mistakes** - Typical errors and how to avoid them
    7. **Further Reading** - Suggestions for additional learning
    
    Make the content engaging, beginner-friendly, and include plenty of code examples.
    Use markdown formatting for better readability.
    Keep the total content between 1000-2000 words.
    """
    
    try:
        # Use non-streaming version for lesson generation
        response = chat(
            model=MODEL,
            messages=[
                {"role": "system", "content": (
                    "You are an expert programming instructor who creates engaging, "
                    "comprehensive lesson content. You excel at explaining complex "
                    "concepts in simple terms and providing practical code examples. "
                    "Always use markdown formatting and structure content clearly."
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