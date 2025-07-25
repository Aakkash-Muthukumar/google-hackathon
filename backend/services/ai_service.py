import time
from ollama import chat

MODEL = "gemma3n:e2b-it-q4_K_M"

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
        content = chunk.get("message", {}).get("content", "")
        if content:
            yield content 