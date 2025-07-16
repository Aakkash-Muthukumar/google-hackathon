import React, { useState, useEffect } from 'react';
import './App.css';

export default function App() {
  const [mode, setMode] = useState('ask');
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [flashcards, setFlashcards] = useState([]);
  const [currentCard, setCurrentCard] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [xp, setXP] = useState(0);
  const [level, setLevel] = useState(1);

  useEffect(() => {
    fetch('/flashcards/python.json')
      .then(res => res.json())
      .then(setFlashcards);
  }, []);

  const askGemma = async () => {
    const res = await fetch('http://localhost:3000/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: question })
    });
    const data = await res.json();
    setResponse(data.response);
  };

  const loadFlashcard = () => {
    const card = flashcards[Math.floor(Math.random() * flashcards.length)];
    setCurrentCard(card);
    setShowAnswer(false);
  };

  const markCorrect = () => {
    const newXP = xp + 10;
    setXP(newXP);
    if (newXP >= level * 50) setLevel(level + 1);
    loadFlashcard();
  };

  const markWrong = () => {
    loadFlashcard();
  };

  return (
    <div className="App">
      <h1>Offline Programming Tutor</h1>

      <div className="mode-toggle">
        <button onClick={() => setMode('ask')}>Ask Tutor</button>
        <button onClick={() => setMode('practice')}>Practice Mode</button>
      </div>

      {mode === 'ask' && (
        <div className="ask-section">
          <input
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Ask a programming question..."
          />
          <button onClick={askGemma}>Ask</button>
          <div className="response-box">
            <strong>Response:</strong>
            <p>{response}</p>
          </div>
        </div>
      )}

      {mode === 'practice' && (
        <div className="flashcard-section">
          {!currentCard && <button onClick={loadFlashcard}>Start Practice</button>}
          {currentCard && (
            <div>
              <p className="question">Q: {currentCard.question}</p>
              {showAnswer ? (
                <>
                  <p className="answer">A: {currentCard.answer}</p>
                  <button onClick={markCorrect}>I got it right</button>
                  <button onClick={markWrong}>I got it wrong</button>
                </>
              ) : (
                <button onClick={() => setShowAnswer(true)}>Show Answer</button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="progress-bar">
        <p>XP: {xp} | Level: {level}</p>
      </div>
    </div>
  );
}
