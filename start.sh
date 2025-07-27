#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Programming Learning Platform...${NC}"

# Check if Python dependencies are installed
if [ ! -d "backend/__pycache__" ] && [ ! -f "backend/.venv" ]; then
    echo -e "${YELLOW}📦 Installing Python dependencies...${NC}"
    cd backend
    pip install -r requirements.txt
    cd ..
fi

# Check if Node dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing Node.js dependencies...${NC}"
    cd frontend
    npm install
    cd ..
fi

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down servers...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Backend server stopped${NC}"
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start the FastAPI backend server with auto-reload in the background
echo -e "${GREEN}🔧 Starting FastAPI backend on http://localhost:8000${NC}"
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
cd ..
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Check if backend started successfully
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Failed to start backend server${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backend server started successfully${NC}"

# Start the Vite frontend
echo -e "${GREEN}🎨 Starting Vite frontend on http://localhost:5173${NC}"
cd frontend
npm run dev
cd ..

# If we get here, the frontend has stopped
cleanup 