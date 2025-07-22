#!/bin/bash

# Start the FastAPI backend server with auto-reload
echo "Starting FastAPI backend on http://localhost:8000 ..."
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload 