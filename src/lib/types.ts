export interface User {
  id: string;
  name: string;
  avatar: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  streak: number;
  language: "python" | "javascript" | "cpp" | "java";
  uiLanguage: "en" | "es" | "fr" | "de";
  achievements: string[];
  theme: "light" | "dark";
}

export interface FlashCard {
  id: string;
  term: string;
  definition: string;
  language: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  known: boolean;
  reviewLater: boolean;
  lastReviewed?: Date;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  language: string;
  topic: string;
  xpReward: number;
  testCases: TestCase[];
  solution?: string;
  hints: string[];
  completed: boolean;
  template: string;
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  hidden?: boolean;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: "user" | "tutor";
  timestamp: Date;
  threadId?: string;
}

export interface Progress {
  totalXP: number;
  challengesCompleted: number;
  flashcardsLearned: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: Date;
}

export interface ChatSession {
  id: string;
  name: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}