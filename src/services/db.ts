import type { 
  Quote, Collection, JournalEntry, Goal, MoodRecord, 
  Achievement, AppNotification, AIHistoryItem, DevSettings 
} from '../types';
import { SEED_QUOTES, DEFAULT_COLLECTIONS, INITIAL_ACHIEVEMENTS } from '../mockData';

// Constants for local storage keys
const KEY_DEV_SETTINGS = 'quoteverse_dev_settings';
const KEY_QUOTES = 'quoteverse_quotes';
const KEY_FAVORITES = 'quoteverse_favorites';
const KEY_COLLECTIONS = 'quoteverse_collections';
const KEY_JOURNALS = 'quoteverse_journals';
const KEY_GOALS = 'quoteverse_goals';
const KEY_MOODS = 'quoteverse_moods';
const KEY_ACHIEVEMENTS = 'quoteverse_achievements';
const KEY_NOTIFICATIONS = 'quoteverse_notifications';
const KEY_AI_HISTORY = 'quoteverse_ai_history';
const KEY_ACTIVITY = 'quoteverse_activity';

// ----------------------------------------------------
// Developer Settings Manager
// ----------------------------------------------------
export const getDevSettings = (): DevSettings => {
  const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const envProjId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const envGeminiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (envApiKey && envProjId) {
    return {
      firebaseConfig: {
        apiKey: envApiKey,
        authDomain: `${envProjId}.firebaseapp.com`,
        projectId: envProjId,
        storageBucket: `${envProjId}.appspot.com`,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
        appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1234567890:web:abcdef'
      },
      geminiApiKey: envGeminiKey || '',
      useRealFirebase: true,
      useRealGemini: !!envGeminiKey
    };
  }

  const stored = localStorage.getItem(KEY_DEV_SETTINGS);
  if (!stored) {
    return {
      firebaseConfig: null,
      geminiApiKey: '',
      useRealFirebase: false,
      useRealGemini: false
    };
  }
  try {
    return JSON.parse(stored) as DevSettings;
  } catch {
    return {
      firebaseConfig: null,
      geminiApiKey: '',
      useRealFirebase: false,
      useRealGemini: false
    };
  }
};

export const saveDevSettings = (settings: DevSettings): void => {
  localStorage.setItem(KEY_DEV_SETTINGS, JSON.stringify(settings));
};

// Lazy firebase initialization utility
const getFirebaseDB = async () => {
  const settings = getDevSettings();
  if (settings.useRealFirebase && settings.firebaseConfig) {
    try {
      const { initializeApp, getApps, getApp } = await import('firebase/app');
      const { getFirestore } = await import('firebase/firestore');
      const app = getApps().length === 0 ? initializeApp(settings.firebaseConfig) : getApp();
      return getFirestore(app);
    } catch (e) {
      console.error("Firebase DB init failed:", e);
      return null;
    }
  }
  return null;
};

// ----------------------------------------------------
// Local Caching Helpers
// ----------------------------------------------------
const getCachedData = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  if (!data) return defaultValue;
  try {
    return JSON.parse(data) as T;
  } catch {
    return defaultValue;
  }
};

const setCachedData = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

// ----------------------------------------------------
// Quotes Collection
// ----------------------------------------------------
export const getQuotes = async (): Promise<Quote[]> => {
  const db = await getFirebaseDB();
  if (db) {
    try {
      const { collection, getDocs } = await import('firebase/firestore');
      const querySnapshot = await getDocs(collection(db, 'quotes'));
      const list: Quote[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Quote);
      });
      if (list.length > 0) {
        setCachedData(KEY_QUOTES, list);
        return list;
      }
    } catch (e) {
      console.error("Error reading quotes from firestore:", e);
    }
  }
  
  // Fallback to local cache or seed quotes
  let cached = getCachedData<Quote[]>(KEY_QUOTES, []);
  if (cached.length === 0) {
    cached = SEED_QUOTES;
    setCachedData(KEY_QUOTES, cached);
  }
  return cached;
};

export const saveQuote = async (quote: Quote): Promise<void> => {
  const db = await getFirebaseDB();
  if (db) {
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'quotes', quote.id), quote);
    } catch (e) {
      console.error("Error writing quote to firestore:", e);
    }
  }
  
  const cached = getCachedData<Quote[]>(KEY_QUOTES, []);
  const idx = cached.findIndex(q => q.id === quote.id);
  if (idx > -1) {
    cached[idx] = quote;
  } else {
    cached.push(quote);
  }
  setCachedData(KEY_QUOTES, cached);
};

// ----------------------------------------------------
// Favorites Collection
// ----------------------------------------------------
export const getFavorites = async (userId: string): Promise<string[]> => {
  const db = await getFirebaseDB();
  if (db && userId) {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const docSnap = await getDoc(doc(db, 'favorites', userId));
      if (docSnap.exists()) {
        const list = docSnap.data().quoteIds || [];
        setCachedData(KEY_FAVORITES, list);
        return list;
      }
    } catch (e) {
      console.error("Error reading favorites from firestore:", e);
    }
  }
  return getCachedData<string[]>(KEY_FAVORITES, []);
};

export const toggleFavorite = async (userId: string, quoteId: string): Promise<boolean> => {
  const favorites = getCachedData<string[]>(KEY_FAVORITES, []);
  const exists = favorites.includes(quoteId);
  let updatedFavorites: string[];

  if (exists) {
    updatedFavorites = favorites.filter(id => id !== quoteId);
  } else {
    updatedFavorites = [...favorites, quoteId];
    // Trigger Achievements check for collector
    await checkCollectorAchievement(updatedFavorites.length);
  }

  setCachedData(KEY_FAVORITES, updatedFavorites);

  const db = await getFirebaseDB();
  if (db && userId) {
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'favorites', userId), { quoteIds: updatedFavorites }, { merge: true });
    } catch (e) {
      console.error("Error saving favorites to firestore:", e);
    }
  }

  return !exists;
};

// ----------------------------------------------------
// Collections Manager
// ----------------------------------------------------
export const getCollections = async (userId: string): Promise<Collection[]> => {
  const db = await getFirebaseDB();
  if (db && userId) {
    try {
      const { collection, getDocs, query, where } = await import('firebase/firestore');
      const q = query(collection(db, 'collections'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const list: Collection[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Collection);
      });
      if (list.length > 0) {
        setCachedData(KEY_COLLECTIONS, list);
        return list;
      }
    } catch (e) {
      console.error("Error reading collections from firestore:", e);
    }
  }

  let cached = getCachedData<Collection[]>(KEY_COLLECTIONS, []);
  if (cached.length === 0) {
    cached = DEFAULT_COLLECTIONS;
    setCachedData(KEY_COLLECTIONS, cached);
  }
  return cached;
};

export const createCollection = async (userId: string, name: string, icon: string): Promise<Collection> => {
  const cached = getCachedData<Collection[]>(KEY_COLLECTIONS, []);
  const newCol: Collection = {
    id: `col_${Date.now()}`,
    name,
    icon,
    quoteIds: []
  };
  cached.push(newCol);
  setCachedData(KEY_COLLECTIONS, cached);

  const db = await getFirebaseDB();
  if (db && userId) {
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'collections', newCol.id), { ...newCol, userId });
    } catch (e) {
      console.error("Error creating firestore collection:", e);
    }
  }

  return newCol;
};

export const addQuoteToCollection = async (userId: string, collectionId: string, quoteId: string): Promise<void> => {
  const cached = getCachedData<Collection[]>(KEY_COLLECTIONS, []);
  const col = cached.find(c => c.id === collectionId);
  if (col) {
    if (!col.quoteIds.includes(quoteId)) {
      col.quoteIds.push(quoteId);
      setCachedData(KEY_COLLECTIONS, cached);

      const db = await getFirebaseDB();
      if (db && userId) {
        try {
          const { doc, updateDoc, arrayUnion } = await import('firebase/firestore');
          await updateDoc(doc(db, 'collections', collectionId), {
            quoteIds: arrayUnion(quoteId)
          });
        } catch (e) {
          console.error("Error adding quote to firestore collection:", e);
        }
      }
    }
  }
};

// ----------------------------------------------------
// Journals (AI Diary)
// ----------------------------------------------------
export const getJournals = async (userId: string): Promise<JournalEntry[]> => {
  const db = await getFirebaseDB();
  if (db && userId) {
    try {
      const { collection, getDocs, query, where, orderBy } = await import('firebase/firestore');
      const q = query(collection(db, 'journals'), where('userId', '==', userId), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      const list: JournalEntry[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as JournalEntry);
      });
      setCachedData(KEY_JOURNALS, list);
      return list;
    } catch (e) {
      console.error("Error reading journals from firestore:", e);
    }
  }
  return getCachedData<JournalEntry[]>(KEY_JOURNALS, []);
};

export const addJournal = async (userId: string, entry: Omit<JournalEntry, 'id'>): Promise<JournalEntry> => {
  const id = `jrn_${Date.now()}`;
  const fullEntry: JournalEntry = { id, ...entry };

  const cached = getCachedData<JournalEntry[]>(KEY_JOURNALS, []);
  cached.unshift(fullEntry); // Newest first
  setCachedData(KEY_JOURNALS, cached);

  const db = await getFirebaseDB();
  if (db && userId) {
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'journals', id), { ...fullEntry, userId });
    } catch (e) {
      console.error("Error saving journal to firestore:", e);
    }
  }

  await trackActivity(userId);
  await checkInspirationMasterAchievement();
  return fullEntry;
};

// ----------------------------------------------------
// Goal Planner
// ----------------------------------------------------
export const getGoals = async (userId: string): Promise<Goal[]> => {
  const db = await getFirebaseDB();
  if (db && userId) {
    try {
      const { collection, getDocs, query, where } = await import('firebase/firestore');
      const q = query(collection(db, 'goals'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const list: Goal[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Goal);
      });
      setCachedData(KEY_GOALS, list);
      return list;
    } catch (e) {
      console.error("Error reading goals from firestore:", e);
    }
  }
  return getCachedData<Goal[]>(KEY_GOALS, []);
};

export const saveGoal = async (userId: string, goal: Goal): Promise<void> => {
  const cached = getCachedData<Goal[]>(KEY_GOALS, []);
  const idx = cached.findIndex(g => g.id === goal.id);
  if (idx > -1) {
    cached[idx] = goal;
  } else {
    cached.push(goal);
  }
  setCachedData(KEY_GOALS, cached);

  const db = await getFirebaseDB();
  if (db && userId) {
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'goals', goal.id), { ...goal, userId });
    } catch (e) {
      console.error("Error saving goal to firestore:", e);
    }
  }
};

// ----------------------------------------------------
// Mood Analysis History
// ----------------------------------------------------
export const getMoods = async (userId: string): Promise<MoodRecord[]> => {
  const db = await getFirebaseDB();
  if (db && userId) {
    try {
      const { collection, getDocs, query, where } = await import('firebase/firestore');
      const q = query(collection(db, 'moods'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const list: MoodRecord[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as MoodRecord);
      });
      setCachedData(KEY_MOODS, list);
      return list;
    } catch (e) {
      console.error("Error reading moods from firestore:", e);
    }
  }
  return getCachedData<MoodRecord[]>(KEY_MOODS, []);
};

export const addMoodRecord = async (userId: string, record: Omit<MoodRecord, 'id'>): Promise<MoodRecord> => {
  const id = `mood_${Date.now()}`;
  const fullRecord: MoodRecord = { id, ...record };

  const cached = getCachedData<MoodRecord[]>(KEY_MOODS, []);
  cached.unshift(fullRecord);
  setCachedData(KEY_MOODS, cached);

  const db = await getFirebaseDB();
  if (db && userId) {
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'moods', id), { ...fullRecord, userId });
    } catch (e) {
      console.error("Error saving mood to firestore:", e);
    }
  }

  await trackActivity(userId);
  await checkInspirationMasterAchievement();
  return fullRecord;
};

// ----------------------------------------------------
// Achievements System (Badges)
// ----------------------------------------------------
export const getAchievements = async (userId: string): Promise<Achievement[]> => {
  const db = await getFirebaseDB();
  if (db && userId) {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const docSnap = await getDoc(doc(db, 'achievements', userId));
      if (docSnap.exists()) {
        const list = docSnap.data().list || [];
        setCachedData(KEY_ACHIEVEMENTS, list);
        return list;
      }
    } catch (e) {
      console.error("Error reading achievements from firestore:", e);
    }
  }

  let cached = getCachedData<Achievement[]>(KEY_ACHIEVEMENTS, []);
  if (cached.length === 0) {
    cached = INITIAL_ACHIEVEMENTS;
    setCachedData(KEY_ACHIEVEMENTS, cached);
  }
  return cached;
};

export const unlockAchievement = async (userId: string, achievementId: string): Promise<boolean> => {
  const cached = await getAchievements(userId);
  const ach = cached.find(a => a.id === achievementId);
  if (ach && !ach.earned) {
    ach.earned = true;
    ach.earnedDate = new Date().toLocaleDateString();
    setCachedData(KEY_ACHIEVEMENTS, cached);

    const db = await getFirebaseDB();
    if (db && userId) {
      try {
        const { doc, setDoc } = await import('firebase/firestore');
        await setDoc(doc(db, 'achievements', userId), { list: cached }, { merge: true });
      } catch (e) {
        console.error("Error updating firestore achievements:", e);
      }
    }

    // Trigger local alert / notification
    await addNotification(userId, {
      title: '🏆 Achievement Unlocked!',
      body: `You earned the "${ach.title}" badge: ${ach.description}`,
      type: 'achievement'
    });

    // Lazy load canvas-confetti
    try {
      const confetti = (await import('canvas-confetti')).default;
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#6366f1', '#d946ef']
      });
    } catch (err) {
      console.log("Confetti animation omitted:", err);
    }

    return true;
  }
  return false;
};

// Checkers for accomplishments
export const checkFirstQuoteAchievement = async (userId: string) => {
  await unlockAchievement(userId, 'ach_first_quote');
};

const checkCollectorAchievement = async (savedCount: number) => {
  const cached = getCachedData<Achievement[]>(KEY_ACHIEVEMENTS, []);
  const ach = cached.find(a => a.id === 'ach_collector');
  if (ach && !ach.earned) {
    ach.progress = savedCount;
    if (savedCount >= (ach.maxProgress || 10)) {
      setCachedData(KEY_ACHIEVEMENTS, cached);
      const user = localStorage.getItem('quoteverse_auth_user');
      if (user) {
        const uid = JSON.parse(user).uid;
        await unlockAchievement(uid, 'ach_collector');
      }
    } else {
      setCachedData(KEY_ACHIEVEMENTS, cached);
    }
  }
};

const checkInspirationMasterAchievement = async () => {
  const cached = getCachedData<Achievement[]>(KEY_ACHIEVEMENTS, []);
  const ach = cached.find(a => a.id === 'ach_master');
  if (ach && !ach.earned) {
    const curProgress = (ach.progress || 0) + 1;
    ach.progress = curProgress;
    if (curProgress >= (ach.maxProgress || 5)) {
      setCachedData(KEY_ACHIEVEMENTS, cached);
      const user = localStorage.getItem('quoteverse_auth_user');
      if (user) {
        const uid = JSON.parse(user).uid;
        await unlockAchievement(uid, 'ach_master');
      }
    } else {
      setCachedData(KEY_ACHIEVEMENTS, cached);
    }
  }
};

// ----------------------------------------------------
// Notifications System
// ----------------------------------------------------
export const getNotifications = async (userId: string): Promise<AppNotification[]> => {
  const db = await getFirebaseDB();
  if (db && userId) {
    try {
      const { collection, getDocs, query, where } = await import('firebase/firestore');
      const q = query(collection(db, 'notifications'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const list: AppNotification[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as AppNotification);
      });
      setCachedData(KEY_NOTIFICATIONS, list);
      return list;
    } catch (e) {
      console.error("Error reading notifications:", e);
    }
  }
  return getCachedData<AppNotification[]>(KEY_NOTIFICATIONS, []);
};

export const addNotification = async (
  userId: string, 
  notify: Omit<AppNotification, 'id' | 'timestamp' | 'read'>
): Promise<AppNotification> => {
  const id = `not_${Date.now()}`;
  const fullNotification: AppNotification = {
    id,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    read: false,
    ...notify
  };

  const cached = getCachedData<AppNotification[]>(KEY_NOTIFICATIONS, []);
  cached.unshift(fullNotification);
  setCachedData(KEY_NOTIFICATIONS, cached);

  const db = await getFirebaseDB();
  if (db && userId) {
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'notifications', id), { ...fullNotification, userId });
    } catch (e) {
      console.error("Error saving notification to firestore:", e);
    }
  }

  // Trigger web notification if supported and permission is granted
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(fullNotification.title, { body: fullNotification.body });
  }

  return fullNotification;
};

export const markNotificationRead = async (userId: string, notifyId: string): Promise<void> => {
  const cached = getCachedData<AppNotification[]>(KEY_NOTIFICATIONS, []);
  const notify = cached.find(n => n.id === notifyId);
  if (notify) {
    notify.read = true;
    setCachedData(KEY_NOTIFICATIONS, cached);

    const db = await getFirebaseDB();
    if (db && userId) {
      try {
        const { doc, updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'notifications', notifyId), { read: true });
      } catch (e) {
        console.error("Error marking notification read in firestore:", e);
      }
    }
  }
};

// ----------------------------------------------------
// AI History Collection
// ----------------------------------------------------
export const getAIHistory = async (userId: string): Promise<AIHistoryItem[]> => {
  const db = await getFirebaseDB();
  if (db && userId) {
    try {
      const { collection, getDocs, query, where, orderBy } = await import('firebase/firestore');
      const q = query(collection(db, 'ai_history'), where('userId', '==', userId), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      const list: AIHistoryItem[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as AIHistoryItem);
      });
      setCachedData(KEY_AI_HISTORY, list);
      return list;
    } catch (e) {
      console.error("Error reading AI history:", e);
    }
  }
  return getCachedData<AIHistoryItem[]>(KEY_AI_HISTORY, []);
};

export const addAIHistoryItem = async (userId: string, item: Omit<AIHistoryItem, 'id' | 'timestamp'>): Promise<AIHistoryItem> => {
  const id = `aih_${Date.now()}`;
  const fullItem: AIHistoryItem = {
    id,
    timestamp: new Date().toLocaleString(),
    ...item
  };

  const cached = getCachedData<AIHistoryItem[]>(KEY_AI_HISTORY, []);
  cached.unshift(fullItem);
  setCachedData(KEY_AI_HISTORY, cached);

  const db = await getFirebaseDB();
  if (db && userId) {
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'ai_history', id), { ...fullItem, userId });
    } catch (e) {
      console.error("Error saving AI history to firestore:", e);
    }
  }

  return fullItem;
};

// ----------------------------------------------------
// Activity Tracker & Streaks (Calendar)
// ----------------------------------------------------
export interface ActivityCalendar {
  [date: string]: number; // date in format YYYY-MM-DD -> count
}

export const getActivityCalendar = (): ActivityCalendar => {
  return getCachedData<ActivityCalendar>(KEY_ACTIVITY, {});
};

export const trackActivity = async (userId: string): Promise<number> => {
  const today = new Date().toISOString().split('T')[0];
  const calendar = getActivityCalendar();
  
  calendar[today] = (calendar[today] || 0) + 1;
  setCachedData(KEY_ACTIVITY, calendar);

  // Re-calculate streak
  let streak = 0;
  let current = new Date();

  // Simple streak algorithm
  for (let i = 0; i < 30; i++) {
    const checkStr = current.toISOString().split('T')[0];
    if (calendar[checkStr]) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      // If we miss today but have yesterday, don't break yet if checking i === 0
      if (i === 0) {
        current.setDate(current.getDate() - 1);
        const checkPrev = current.toISOString().split('T')[0];
        if (calendar[checkPrev]) {
          streak++;
          current.setDate(current.getDate() - 1);
          continue;
        }
      }
      break;
    }
  }

  // Update achievements for streaks
  if (streak >= 7) {
    await unlockAchievement(userId, 'ach_streak_7');
  }
  if (streak >= 30) {
    await unlockAchievement(userId, 'ach_streak_30');
  }

  // Update progress fields
  const achievements = getCachedData<Achievement[]>(KEY_ACHIEVEMENTS, []);
  const a7 = achievements.find(a => a.id === 'ach_streak_7');
  if (a7 && !a7.earned) {
    a7.progress = Math.min(streak, 7);
  }
  const a30 = achievements.find(a => a.id === 'ach_streak_30');
  if (a30 && !a30.earned) {
    a30.progress = Math.min(streak, 30);
  }
  setCachedData(KEY_ACHIEVEMENTS, achievements);

  return streak;
};
