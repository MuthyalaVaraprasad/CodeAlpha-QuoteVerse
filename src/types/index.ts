export interface Quote {
  id: string;
  text: string;
  author: string;
  category: string;
  isTrending?: boolean;
  isAIRecommended?: boolean;
  explanation?: {
    meaning: string;
    lesson: string;
    application: string;
  };
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL: string;
  joinDate: string;
  readingHistory: { quoteId: string; timestamp: string }[];
  favorites: string[]; // List of Quote IDs
  daysActive: number;
  collectionsCreated: number;
}

export interface Collection {
  id: string;
  name: string;
  icon: string;
  quoteIds: string[];
  isDefault?: boolean;
}

export interface JournalEntry {
  id: string;
  date: string;
  text: string;
  sentiment: {
    score: number; // 0 to 100
    label: 'Positive' | 'Neutral' | 'Negative';
    analysis: string;
  };
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface Goal {
  id: string;
  title: string;
  category: string;
  targetDate: string;
  milestones: Milestone[];
  progress: number; // Percentage 0-100
  completed: boolean;
}

export interface MoodRecord {
  id: string;
  date: string;
  thoughts: string;
  score: number; // 0 to 10
  label: string; // e.g. "Anxious", "Excited", "Stressed"
  analysis: string;
  recommendations: string[];
  suggestedQuoteIds: string[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedDate?: string;
  progress?: number;
  maxProgress?: number;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  type: 'motivation' | 'quote' | 'goal' | 'mood' | 'achievement';
}

export interface AIHistoryItem {
  id: string;
  type: 'generator' | 'career' | 'productivity' | 'mood' | 'journal' | 'explainer' | 'feed';
  timestamp: string;
  prompt: string;
  response: string;
}

export interface DevSettings {
  firebaseConfig: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  } | null;
  geminiApiKey: string;
  useRealFirebase: boolean;
  useRealGemini: boolean;
}
