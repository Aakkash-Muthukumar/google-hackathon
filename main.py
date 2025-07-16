import ollama

def get_response():
    prompt = f"Hello"
    response = ollama.chat(model='gemma3n', messages=[
        {'role': 'user', 'content': prompt}
    ])
    print(response['message']['content'])
    
if __name__ == "__main__":
    get_response()
    print("Response received successfully.")