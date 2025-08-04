import time
from ollama import chat

MODEL = "gemma3n"

def ask_gemma(prompt: str):
    response = chat(
        model=MODEL,
        messages=[
            {"role": "system", "content": (
                "You are a highly skilled and friendly tutor who provides short, concise, and helpful responses. "
                "You help students understand concepts clearly across various subjects including programming, math, science, art, and more. "
                "You are well-versed in Python, JavaScript, C++, Java, and many other subjects. "
                "IMPORTANT RULES: "
                "1. Always provide a TLDR (Too Long; Didn't Read) section at the end of your response. "
                "2. Keep responses focused, practical, and easy to understand. "
                "3. Avoid unnecessary verbosity and get straight to the point. "
                "4. DO NOT use course-style formatting with progress checkpoints or part divisions. "
                "5. DO NOT structure responses into multiple parts with completion percentages. "
                "6. Provide direct, conversational answers that are helpful and concise. "
                "7. Always end with a clear TLDR summary."
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

def ask_gemma_tutor(prompt: str):
    """Specialized function for AI tutor with explicit non-course formatting"""
    response = chat(
        model=MODEL,
        messages=[
            {"role": "system", "content": (
                "You are a helpful, concise tutor. You provide direct answers without course-style formatting. "
                "NEVER use progress checkpoints, part divisions, or completion percentages. "
                "Keep responses short and conversational. "
                "ALWAYS end with a TLDR section. "
                "Be direct and helpful."
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

def generate_lesson_content(lesson_title: str, lesson_description: str, subject_area: str = "general", difficulty: str = "beginner"):
    """
    Generate comprehensive lesson content using AI with progress breakpoints
    """
    prompt = f"""
    Create a comprehensive lesson with the following details:
    
    Lesson Title: {lesson_title}
    Lesson Description: {lesson_description}
    Subject Area: {subject_area}
    Difficulty Level: {difficulty}
    
    IMPORTANT: Structure the lesson content into 4 equal parts with clear progress breakpoints.
    Adapt the content to the subject matter:
    
    **PART 1 (0-25%): Introduction and Basic Concepts**
    - Brief overview of what will be covered
    - Basic definitions and fundamental concepts
    - Simple examples to introduce the topic
    
    **PART 2 (25-50%): Detailed Explanation**
    - In-depth explanation of the concept with clear examples
    - More detailed examples appropriate to the subject
    - Step-by-step breakdown of concepts
    
    **PART 3 (50-75%): Advanced Examples and Practice**
    - Multiple practical examples demonstrating the concept
    - Intermediate-level examples
    - Common use cases and scenarios
    
    **PART 4 (75-100%): Exercises and Summary**
    - 2-3 hands-on exercises or activities for students to practice
    - Key takeaways and summary of important points
    - Common mistakes and how to avoid them
    - Further reading suggestions
    
    At the end of each part, include a clear progress marker:
    - After Part 1: "## 🎯 25% Content Complete"
    - After Part 2: "## 🎯 50% Content Complete" 
    - After Part 3: "## 🎯 75% Content Complete"
    - At the end: "## 🎯 100% Content Complete"
    
    Make the content engaging, beginner-friendly, and include plenty of relevant examples.
    For programming courses, include code examples.
    For art courses, focus on techniques, visual descriptions, and artistic concepts.
    For math courses, include formulas, calculations, and step-by-step solutions.
    For science courses, include explanations, experiments, and scientific concepts.
    
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
                    "You are an expert instructor who creates engaging, "
                    "comprehensive lesson content with clear progress tracking. You excel at "
                    "explaining complex concepts in simple terms and providing practical examples. "
                    "You can teach various subjects including programming, art, math, science, and more. "
                    "Always use markdown formatting and structure content into 4 equal parts with "
                    "progress breakpoints at 25%, 50%, 75%, and 100%. Each part should be "
                    "roughly equal in length and build upon the previous sections. "
                    "Adapt your examples and terminology to the specific subject matter."
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