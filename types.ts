export interface WordEntry {
  id: string;
  word: string;
  pronunciation: string;
  meaning: string;
  explanation: string;
  example: string;
  theme: string;
  addedAt: number;
}

export interface QuizResult {
  id: string;
  date: string; // ISO Date string
  score: number;
  totalQuestions: number;
  xpEarned: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (stats: { words: number; quizzes: number; perfectScores: number }) => boolean;
}

export interface UserProfile {
  xp: number;
  level: number;
  unlockedBadges: string[];
}

export enum Tab {
  LEARN = 'LEARN',
  FLASHCARD = 'FLASHCARD',
  QUIZ = 'QUIZ',
  STATS = 'STATS'
}

export interface GeneratedWordData {
  pronunciation: string;
  meaning: string;
  explanation: string;
  example: string;
}
