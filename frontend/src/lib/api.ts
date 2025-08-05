import { buildApiUrl, API_ENDPOINTS } from './config';

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = buildApiUrl(endpoint);
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Flashcard API
export const flashcardAPI = {
  getAll: () => apiRequest(API_ENDPOINTS.FLASHCARDS),
  
  getById: (id: string) => apiRequest(`${API_ENDPOINTS.FLASHCARDS}/${id}`),
  
  create: (data: Record<string, unknown>) => apiRequest(API_ENDPOINTS.FLASHCARDS, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  update: (id: string, data: Record<string, unknown>) => apiRequest(`${API_ENDPOINTS.FLASHCARDS}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  
  delete: (id: string) => apiRequest(`${API_ENDPOINTS.FLASHCARDS}/${id}`, {
    method: 'DELETE',
  }),
};

// Challenge API
export const challengeAPI = {
  getAll: () => apiRequest(`${API_ENDPOINTS.CHALLENGES}/all`),
  
  verify: (challengeId: number | string, userCode: string) => 
    apiRequest(`${API_ENDPOINTS.CHALLENGES}/verify`, {
      method: 'POST',
      body: JSON.stringify({ challenge_id: Number(challengeId), user_code: userCode }),
    }),
  
  getSolution: (challengeId: number | string) => 
    apiRequest(`${API_ENDPOINTS.CHALLENGES}/solution`, {
      method: 'POST',
      body: JSON.stringify({ challenge_id: Number(challengeId) }),
    }),
  
  getHints: (challengeId: number | string) => 
    apiRequest(`${API_ENDPOINTS.CHALLENGES}/hints`, {
      method: 'POST',
      body: JSON.stringify({ challenge_id: Number(challengeId) }),
    }),
  
  getCongrats: (challengeTitle: string, userCode: string) => 
    apiRequest(`${API_ENDPOINTS.CHALLENGES}/congrats`, {
      method: 'POST',
      body: JSON.stringify({ title: challengeTitle, user_code: userCode }),
    }),
};

// Tutor API
export const tutorAPI = {
  ask: async (prompt: string): Promise<ReadableStream<Uint8Array> | null> => {
    const url = buildApiUrl(API_ENDPOINTS.ASK);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok || !response.body) {
      throw new Error('Failed to get response from tutor');
    }

    return response.body;
  },
};

// Course API
export const courseAPI = {
  getAll: () => apiRequest(API_ENDPOINTS.COURSES),
  
  getById: (id: string) => apiRequest(`${API_ENDPOINTS.COURSES}/${id}`),
  
  create: (data: Record<string, unknown>) => apiRequest(API_ENDPOINTS.COURSES, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  update: (id: string, data: Record<string, unknown>) => apiRequest(`${API_ENDPOINTS.COURSES}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  delete: (id: string) => apiRequest(`${API_ENDPOINTS.COURSES}/${id}`, {
    method: 'DELETE',
  }),

  generateLesson: (data: {
    lesson_title: string;
    lesson_description: string;
    programming_language: string;
    difficulty?: string;
  }) => apiRequest(`${API_ENDPOINTS.COURSES}/generate-lesson`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  generateLessonContent: (courseId: string, lessonId: string) => 
    apiRequest(`${API_ENDPOINTS.COURSES}/${courseId}/lessons/${lessonId}/generate-content`, {
      method: 'POST',
    }),

  deleteLesson: (courseId: string, lessonId: string) => 
    apiRequest(`${API_ENDPOINTS.COURSES}/${courseId}/lessons/${lessonId}`, {
      method: 'DELETE',
    }),
};

// Subject API
export const subjectAPI = {
  getAll: () => apiRequest(API_ENDPOINTS.SUBJECTS),
  
  getById: (id: string) => apiRequest(`${API_ENDPOINTS.SUBJECTS}/${id}`),
  
  create: (data: Record<string, unknown>) => apiRequest(API_ENDPOINTS.SUBJECTS, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  update: (id: string, data: Record<string, unknown>) => apiRequest(`${API_ENDPOINTS.SUBJECTS}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  delete: (id: string) => apiRequest(`${API_ENDPOINTS.SUBJECTS}/${id}`, {
    method: 'DELETE',
  }),
};

// Progress API
export const progressAPI = {
  get: () => apiRequest(API_ENDPOINTS.PROGRESS),
  
  update: (data: Record<string, unknown>) => apiRequest(API_ENDPOINTS.PROGRESS, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

// User API
export const userAPI = {
  get: () => apiRequest(API_ENDPOINTS.USER),
  
  update: (data: Record<string, unknown>) => apiRequest(API_ENDPOINTS.USER, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

// Chat API
export const chatAPI = {
  getAll: () => apiRequest(API_ENDPOINTS.CHATS),
  
  getById: (id: string) => apiRequest(`${API_ENDPOINTS.CHATS}/${id}`),
  
  create: (data: Record<string, unknown>) => apiRequest(API_ENDPOINTS.CHATS, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  update: (id: string, data: Record<string, unknown>) => apiRequest(`${API_ENDPOINTS.CHATS}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  delete: (id: string) => apiRequest(`${API_ENDPOINTS.CHATS}/${id}`, {
    method: 'DELETE',
  }),
  
  saveAll: (chats: Record<string, unknown>[]) => apiRequest(`${API_ENDPOINTS.CHATS}/bulk`, {
    method: 'POST',
    body: JSON.stringify(chats),
  }),
  
  setCurrentChat: (id: string) => apiRequest(`${API_ENDPOINTS.CHATS}/current/${id}`, {
    method: 'POST',
  }),
  
  getCurrentChat: () => apiRequest(`${API_ENDPOINTS.CHATS}/current/id`),
}; 