import time
from ollama import chat

def ask_gemma(prompt: str) -> str:
    print("\n🧠 Model is thinking...")
    for i in range(3, 0, -1):
        print(f"⏳ {i}...")
        time.sleep(1)
    response = chat(
        model="gemma3n",
        messages=[
            {"role": "system", "content": (
                "You are a highly skilled and friendly programming tutor. "
                "You help students understand programming concepts clearly. "
                "You are well-versed in Python, JavaScript, C++, and Java."
            )},
            {"role": "user", "content": prompt}
        ]
    )
    print("✅ Response ready!\n")
    return response["message"]["content"] 