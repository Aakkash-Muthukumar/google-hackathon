# Programming Learning Platform

A comprehensive platform for learning programming through interactive challenges, flashcards, and AI-powered tutoring.

## Project Structure

```
programming-learning-platform/
├── frontend/               # React frontend application
│   ├── src/               # Source code
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities and configurations
│   │   │   ├── config.ts  # API configuration
│   │   │   ├── api.ts     # API service layer
│   │   │   ├── storage.ts # Local storage utilities
│   │   │   ├── types.ts   # TypeScript type definitions
│   │   │   └── utils.ts   # Utility functions
│   │   └── main.tsx       # React app entry point
│   ├── public/            # Static assets
│   ├── package.json       # Frontend dependencies
│   ├── vite.config.ts     # Vite configuration
│   ├── tailwind.config.ts # Tailwind CSS configuration
│   ├── tsconfig.json      # TypeScript configuration
│   └── index.html         # HTML entry point
├── backend/               # FastAPI backend application
│   ├── main.py            # FastAPI application entry point
│   ├── requirements.txt   # Python dependencies
│   ├── routes/            # API route handlers
│   │   ├── ask.py        # AI tutoring endpoints
│   │   ├── challenge.py  # Coding challenges endpoints
│   │   ├── flashcard.py  # Flashcards endpoints
│   │   └── subject.py    # Subject management endpoints
│   ├── services/         # Business logic services
│   │   ├── ai_service.py
│   │   ├── challenge_service.py
│   │   ├── flashcard_service.py
│   │   └── subject_service.py
│   └── data/             # JSON data files
│       ├── challenges.json
│       ├── flashcards.json
│       ├── progress.json
│       ├── settings.json
│       └── submission_history.json
├── package.json           # Root project configuration
├── start.sh              # Development startup script
├── setup.sh              # Initial setup script
└── README.md             # This file
```

## Features

- **Interactive Coding Challenges**: Practice with real programming problems
- **Flashcards**: Learn programming concepts with spaced repetition
- **AI Tutor**: Get help from an AI-powered programming tutor
- **Progress Tracking**: Monitor your learning progress and earn XP
- **Offline Support**: Work offline with local storage
- **Multi-language Support**: Support for Python, JavaScript, C++, and Java

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- Python (v3.8 or higher)
- Ollama (for AI tutoring)

### Quick Setup

1. Run the setup script to install all dependencies:
   ```bash
   ./setup.sh
   ```

   This will:
   - Install Node.js dependencies in the frontend
   - Install Python dependencies in the backend
   - Set up Ollama for AI tutoring
   - Create environment configuration

### Manual Setup

#### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Install and start Ollama (for AI tutoring):
   ```bash
   # Install Ollama from https://ollama.ai
   ollama pull gemma3n
   ```

#### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

### Development

1. Start both servers with the provided script:
   ```bash
   ./start.sh
   ```

   This will start:
   - FastAPI backend on http://localhost:8000
   - Vite frontend on http://localhost:5173

2. Or start them separately:
   ```bash
   # Backend
   cd backend && uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   
   # Frontend
   cd frontend && npm run dev
   ```

3. Or use npm scripts:
   ```bash
   # Start both servers
   npm run start
   
   # Start only frontend
   npm run frontend
   
   # Start only backend
   npm run backend
   ```

## API Configuration

The frontend uses a centralized configuration system in `src/lib/config.ts`:

- `API_CONFIG.BASE_URL`: Backend API base URL (default: http://localhost:8000)
- `API_CONFIG.FRONTEND_URL`: Frontend URL (default: http://localhost:5173)
- `API_ENDPOINTS`: Centralized API endpoint definitions

## Environment Variables

Create a `.env.local` file in the root directory to override defaults:

```env
VITE_API_URL=http://localhost:8000
VITE_FRONTEND_URL=http://localhost:5173
VITE_DEV_MODE=true
```

## Technologies Used

### Backend
- FastAPI - Modern Python web framework
- Uvicorn - ASGI server
- Pydantic - Data validation
- Ollama - Local AI models

### Frontend
- React 18 - UI framework
- TypeScript - Type safety
- Vite - Build tool and dev server
- Tailwind CSS - Styling
- shadcn/ui - Component library
- React Router - Navigation
- React Query - Data fetching

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
