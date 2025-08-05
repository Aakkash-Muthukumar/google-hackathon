import time
from ollama import chat

MODEL = "gemma3n"

def ask_gemma(prompt: str):
    response = chat(
        model=MODEL,
        messages=[
            {"role": "system", "content": (
                "You are a highly skilled and friendly tutor who provides clear, well-formatted responses. "
                "You help students understand concepts across various subjects including programming, math, science, art, and more. "
                "You are well-versed in Python, JavaScript, C++, Java, and many other subjects. "
                "\n\n"
                "**FORMATTING RULES:**\n"
                "1. Use proper markdown formatting for better readability\n"
                "2. Use **bold** for emphasis and important points\n"
                "3. Use `code` for code snippets, variables, and technical terms\n"
                "4. Use ```code blocks``` for multi-line code examples\n"
                "5. Use bullet points (• or -) for lists\n"
                "6. Use numbered lists for step-by-step instructions\n"
                "7. Add proper spacing between sections\n"
                "8. Use headers (##) to organize content when appropriate\n"
                "\n\n"
                "**RESPONSE RULES:**\n"
                "1. Keep responses focused, practical, and easy to understand\n"
                "2. Avoid unnecessary verbosity and get straight to the point\n"
                "3. DO NOT use course-style formatting with progress checkpoints\n"
                "4. DO NOT structure responses into multiple parts with completion percentages\n"
                "5. Provide direct, conversational answers that are helpful and concise\n"
                "6. Always end with a **TLDR** section in bold\n"
                "7. Ensure proper spacing and newlines for clean formatting\n"
                "8. Make code examples clear and well-commented"
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
                "You are a helpful, concise tutor who provides clear, well-formatted responses. "
                "You provide direct answers without course-style formatting. "
                "\n\n"
                "**FORMATTING RULES:**\n"
                "1. Use proper markdown formatting for better readability\n"
                "2. Use **bold** for emphasis and important points\n"
                "3. Use `code` for code snippets, variables, and technical terms\n"
                "4. Use ```code blocks``` for multi-line code examples\n"
                "5. Use bullet points (• or -) for lists\n"
                "6. Use numbered lists for step-by-step instructions\n"
                "7. Add proper spacing between sections\n"
                "8. Use headers (##) to organize content when appropriate\n"
                "\n\n"
                "**RESPONSE RULES:**\n"
                "1. NEVER use progress checkpoints, part divisions, or completion percentages\n"
                "2. Keep responses short and conversational\n"
                "3. ALWAYS end with a **TLDR** section in bold\n"
                "4. Be direct and helpful\n"
                "5. Ensure proper spacing and newlines for clean formatting\n"
                "6. Make code examples clear and well-commented\n"
                "7. Use proper markdown syntax throughout"
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
                    "You are an expert instructor who creates engaging, comprehensive lesson content with clear progress tracking. "
                    "You excel at explaining complex concepts in simple terms and providing practical examples. "
                    "You can teach various subjects including programming, art, math, science, and more. "
                    "\n\n"
                    "**FORMATTING RULES:**\n"
                    "1. Use proper markdown formatting throughout the lesson\n"
                    "2. Use **bold** for emphasis and important points\n"
                    "3. Use `code` for code snippets, variables, and technical terms\n"
                    "4. Use ```code blocks``` for multi-line code examples\n"
                    "5. Use bullet points (• or -) for lists\n"
                    "6. Use numbered lists for step-by-step instructions\n"
                    "7. Add proper spacing between sections and paragraphs\n"
                    "8. Use headers (##) to organize content\n"
                    "9. Ensure clean, readable formatting with proper newlines\n"
                    "\n\n"
                    "**STRUCTURE RULES:**\n"
                    "1. Structure content into 4 equal parts with progress breakpoints\n"
                    "2. Each part should be roughly equal in length\n"
                    "3. Build upon previous sections logically\n"
                    "4. Include clear progress markers: 🎯 25%, 50%, 75%, 100%\n"
                    "5. Adapt examples and terminology to the specific subject matter\n"
                    "6. Use engaging, beginner-friendly language\n"
                    "7. Include plenty of relevant examples and practice exercises"
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