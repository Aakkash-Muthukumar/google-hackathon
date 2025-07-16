# 🧠 Offline Programming Tutor (Multilingual)

An **offline-first**, multilingual AI-powered programming tutor designed for **low-resource schools and communities**. Powered locally by **Gemma 3n**, **Whisper**, and open-source tools, this tutor helps students learn programming through voice or text without needing internet access.

## 🌍 Why This Matters

Many students across the world lack stable internet or access to quality programming education. Our solution levels the playing field by providing:

* 📶 **No internet required**
* 🌐 **Multilingual support**
* 💻 **Offline AI model with code understanding**
* 🧑‍🏫 **Interactive voice + text tutoring**
* 🕹️ **Gamified learning progression (level-up + streaks)**

## 🛠️ Features

* 🎤 **Speech-to-Text** using offline **Whisper**
* 💬 **Text & Voice Q\&A** with Gemma 3n (running on-device via Ollama)
* 📚 **Language-specific flashcards & coding quizzes**
* 🎮 **XP-based level system** with progressive challenges
* 🧩 **Support for multiple languages**: Python, JavaScript, C++, etc.
* 🔌 **100% offline**, runs on low-spec hardware
* 📄 **Daily summary export** for teacher or parent review

## 🧱 Tech Stack

| Component        | Tech Used                                          |
| ---------------- | -------------------------------------------------- |
| LLM              | [Gemma 3n](https://ai.google.dev/gemma) via Ollama |
| Speech-to-Text   | Whisper.cpp (offline)                              |
| Frontend         | Local web UI (e.g., Streamlit or custom)           |
| Backend          | Python + FastAPI (or Flask offline)                |
| Data Storage     | SQLite (for offline use)                           |
| Model Finetuning | Unsloth (optional)                                 |

## 🏁 Getting Started

### 🔧 Requirements

* Python 3.10+
* Ollama with Gemma 3n installed (`ollama pull gemma:3n`)
* whisper.cpp or faster-whisper installed locally
* Streamlit (for frontend) or basic HTML/CSS/JS if preferred

### ▶️ Run the App

```bash
git clone https://github.com/yourname/offline-programming-tutor.git
cd offline-programming-tutor

# Start Ollama in the background (Gemma 3n)
ollama run gemma:3n

# Start backend
python app.py

# (Optional) Start frontend
streamlit run frontend.py
```

## 🔍 Example Use Case

1. Student opens the local tutor interface.
2. Chooses language → starts a challenge (e.g., Python loops).
3. Speaks question: “Can you explain while loops?”
4. Whisper transcribes → Gemma 3n responds offline.
5. Student earns XP and unlocks next level.

## 📦 Project Structure

```
offline-programming-tutor/
├── app.py               # Backend API (local)
├── frontend.py          # Streamlit UI
├── whisper_module/      # Local STT handler
├── prompts/             # Gemma tutoring prompts
├── database/            # SQLite DB for user progress
└── README.md
```

## 🧑‍💻 Team

* Vishal Vasanthakumar Poornima
* Aakkash Muthukumar
* Shriman Oppilamani
* Rishi Keshava Damarla
* Kshrugal Jain

## 🎯 Hackathon

Built for the **Gemma 3n Impact Challenge** — enabling education access through offline, private, personal AI.
