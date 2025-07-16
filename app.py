from ollama import chat
from flask import Flask, request, jsonify
from flask_cors import CORS
import time

app = Flask(__name__)
CORS(app)

@app.route("/ask", methods=["POST"])
def ask():
    data = request.json
    if data is None:
        return jsonify({"error": "No JSON data provided."}), 400
    prompt = data.get("prompt", "")
    if not prompt:
        return jsonify({"error": "No prompt provided."}), 400

    print("\n🧠 Model is thinking...")
    for i in range(3, 0, -1):
        print(f"⏳ {i}...")
        time.sleep(1)

    response = chat(
        model="gemma3n",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a highly skilled and friendly programming tutor. "
                    "You help students understand programming concepts clearly. "
                    "You are well-versed in Python, JavaScript, C++, and Java."
                )
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    print("✅ Response ready!\n")
    return jsonify({"response": response["message"]["content"]})


if __name__ == "__main__":
    app.run(debug=True)
