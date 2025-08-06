from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import ask
from routes import subject
from routes import challenge
from routes import flashcard
from routes import course
from routes import chat
from routes import xp
from routes import settings

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ask.router)
app.include_router(subject.router)
app.include_router(challenge.router)
app.include_router(flashcard.router)
app.include_router(course.router)
app.include_router(chat.router)
app.include_router(xp.router)
app.include_router(settings.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 