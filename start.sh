#!/bin/bash

# Start the FastAPI backend server with auto-reload in the background
echo "Starting FastAPI backend"
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload &

# Save the backend PID so we can kill it later
BACKEND_PID=$!

# Start the Vite frontend
echo "Starting Vite frontend"
npm run dev

# When the frontend process exits (e.g., you press Ctrl+C), kill the backend
kill $BACKEND_PID 