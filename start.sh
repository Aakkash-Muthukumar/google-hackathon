#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Programming Learning Platform...${NC}"

# Function to cleanup background processes on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down servers...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Kill any existing processes on port 8000
echo -e "${YELLOW}🔧 Checking for existing backend processes...${NC}"
EXISTING_PIDS=$(lsof -ti:8000 2>/dev/null)
if [ ! -z "$EXISTING_PIDS" ]; then
    echo -e "${YELLOW}🔄 Killing existing processes on port 8000: $EXISTING_PIDS${NC}"
    kill -9 $EXISTING_PIDS 2>/dev/null
    sleep 1
fi

# Start backend server
echo -e "${YELLOW}🔧 Starting backend server...${NC}"
cd backend
python main.py &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Check if backend is running
if ! curl -s http://localhost:8000/challenge/all > /dev/null; then
    echo -e "${RED}❌ Backend server failed to start${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo -e "${GREEN}✅ Backend server started on http://localhost:8000${NC}"

# Start frontend server
echo -e "${YELLOW}🎨 Starting frontend server...${NC}"
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait a moment for frontend to start
sleep 3

echo -e "${GREEN}✅ Frontend server started on http://localhost:5173${NC}"
echo -e "${GREEN}🎉 Both servers are running!${NC}"
echo -e "${BLUE}📱 Frontend: http://localhost:5173${NC}"
echo -e "${BLUE}🔧 Backend: http://localhost:8000${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"

# Wait for background processes
wait 