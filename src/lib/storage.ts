import { User, FlashCard, Challenge, ChatMessage, Progress } from './types';

class LocalStorage {
  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  // User data
  getUser(): User {
    return this.getItem('user', {
      id: '1',
      name: 'Coding Explorer',
      avatar: '🧑‍💻',
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      streak: 0,
      language: 'python',
      uiLanguage: 'en',
      achievements: [],
      theme: 'light'
    });
  }

  saveUser(user: User): void {
    this.setItem('user', user);
  }

  // Flashcards
  getFlashCards(): FlashCard[] {
    return this.getItem('flashcards', []);
  }

  saveFlashCards(flashcards: FlashCard[]): void {
    this.setItem('flashcards', flashcards);
  }

  // Challenges
  getChallenges(): Challenge[] {
    return this.getItem('challenges', []);
  }

  saveChallenges(challenges: Challenge[]): void {
    this.setItem('challenges', challenges);
  }

  // Multi-chat support
  getChats(): import('./types').ChatSession[] {
    return this.getItem('chats', []);
  }

  saveChats(chats: import('./types').ChatSession[]): void {
    this.setItem('chats', chats);
  }

  getCurrentChatId(): string | null {
    return this.getItem('currentChatId', null);
  }

  setCurrentChatId(id: string): void {
    this.setItem('currentChatId', id);
  }

  // Deprecated single chat
  // getChatMessages(): ChatMessage[] {
  //   return this.getItem('chatMessages', []);
  // }

  // saveChatMessages(messages: ChatMessage[]): void {
  //   this.setItem('chatMessages', messages);
  // }

  // Progress
  getProgress(): Progress {
    return this.getItem('progress', {
      totalXP: 0,
      challengesCompleted: 0,
      flashcardsLearned: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: new Date()
    });
  }

  saveProgress(progress: Progress): void {
    this.setItem('progress', progress);
  }

  // Utilities
  clearAllData(): void {
    const keys = ['user', 'flashcards', 'challenges', 'chatMessages', 'progress'];
    keys.forEach(key => localStorage.removeItem(key));
  }
}

export const storage = new LocalStorage();