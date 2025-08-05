import { User, FlashCard, Challenge, ChatMessage, Progress } from './types';
import { chatAPI } from './api';

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

  // Multi-chat support - now using backend storage
  async getChats(): Promise<import('./types').ChatSession[]> {
    try {
      const chats = await chatAPI.getAll() as import('./types').ChatSession[];
      return chats || [];
    } catch (error) {
      console.error('Failed to load chats from backend:', error);
      // Fallback to localStorage if backend fails
      return this.getItem('chats', []);
    }
  }

  async saveChats(chats: import('./types').ChatSession[]): Promise<void> {
    try {
      await chatAPI.saveAll(chats as unknown as Record<string, unknown>[]);
    } catch (error) {
      console.error('Failed to save chats to backend:', error);
      // Fallback to localStorage if backend fails
      this.setItem('chats', chats);
    }
  }

  // Synchronous version for backwards compatibility (uses localStorage as cache)
  getChatsSync(): import('./types').ChatSession[] {
    return this.getItem('chats', []);
  }

  // Fire-and-forget save to backend with localStorage cache
  saveChatsSync(chats: import('./types').ChatSession[]): void {
    // Immediately save to localStorage for quick access
    this.setItem('chats', chats);
    // Save to backend in the background
    chatAPI.saveAll(chats as unknown as Record<string, unknown>[]).catch(error => {
      console.error('Background chat save failed:', error);
    });
  }

  getCurrentChatId(): string | null {
    // For now, keep current chat ID in localStorage for session persistence
    // In a real app, this could be stored in user preferences on the backend
    return this.getItem('currentChatId', null);
  }

  setCurrentChatId(id: string): void {
    // Store locally for session persistence
    this.setItem('currentChatId', id);
    // Also notify backend (fire and forget)
    chatAPI.setCurrentChat(id).catch(error => {
      console.warn('Failed to set current chat on backend:', error);
    });
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
    const keys = ['user', 'flashcards', 'challenges', 'chats', 'currentChatId', 'progress'];
    keys.forEach(key => localStorage.removeItem(key));
  }
}

export const storage = new LocalStorage();