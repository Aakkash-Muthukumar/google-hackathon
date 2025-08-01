#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Setting up Programming Learning Platform...${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js v18 or higher.${NC}"
    echo -e "${YELLOW}Visit: https://nodejs.org/${NC}"
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python 3 is not installed. Please install Python 3.8 or higher.${NC}"
    exit 1
fi

# Check if pip is installed
if ! command -v pip &> /dev/null; then
    echo -e "${RED}pip is not installed. Please install pip.${NC}"
    exit 1
fi

echo -e "${GREEN}Prerequisites check passed${NC}"

# Install Node.js dependencies
echo -e "${YELLOW}Installing Node.js dependencies...${NC}"
cd frontend
npm install
cd ..

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Node.js dependencies installed successfully${NC}"
else
    echo -e "${RED}Failed to install Node.js dependencies${NC}"
    exit 1
fi

# Install Python dependencies
echo -e "${YELLOW}Installing Python dependencies...${NC}"
cd backend
pip install -r requirements.txt
cd ..

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Python dependencies installed successfully${NC}"
else
    echo -e "${RED}Failed to install Python dependencies${NC}"
    exit 1
fi

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo -e "${YELLOW}Ollama is not installed. AI tutoring features will not work.${NC}"
    echo -e "${YELLOW}To install Ollama, visit: https://ollama.ai${NC}"
    echo -e "${YELLOW}After installation, run: ollama pull gemma3n${NC}"
else
    echo -e "${GREEN}Ollama is installed${NC}"
    echo -e "${YELLOW}Pulling AI model (this may take a while)...${NC}"
    ollama pull gemma3n
fi

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}Creating .env.local file...${NC}"
    cat > .env.local << EOF
# API Configuration
VITE_API_URL=http://localhost:8000
VITE_FRONTEND_URL=http://localhost:5173

# Development Settings
VITE_DEV_MODE=true
EOF
    echo -e "${GREEN}.env.local file created${NC}"
fi

echo -e "${GREEN}Setup completed successfully!${NC}"
echo -e "${BLUE}To start the application, run: ./start.sh${NC}"
echo -e "${BLUE}For more information, see README.md${NC}" 