// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173',
  DEV_MODE: import.meta.env.VITE_DEV_MODE === 'true',
};

// API Endpoints
export const API_ENDPOINTS = {
  ASK: '/ask',
  FLASHCARDS: '/flashcard',
  CHALLENGES: '/challenge',
  SUBJECTS: '/subject',
  COURSES: '/course',
  PROGRESS: '/progress',
  USER: '/user',
  CHATS: '/chat',
} as const;

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
}; 