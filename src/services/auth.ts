import type { UserProfile } from '../types';
import { getDevSettings } from './db';

// Key for local storage persistence
const AUTH_USER_KEY = 'quoteverse_auth_user';

// Mock Profile Creator
const createMockProfile = (): UserProfile => {
  return {
    uid: 'mock_user_123',
    name: 'Alex Johnson',
    email: 'alex.johnson@quoteverse.ai',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    joinDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    readingHistory: [],
    favorites: [],
    daysActive: 1,
    collectionsCreated: 5
  };
};

export const loginWithGoogle = async (): Promise<UserProfile> => {
  const settings = getDevSettings();
  
  if (settings.useRealFirebase && settings.firebaseConfig) {
    try {
      // Lazy import firebase to prevent crashes if it is not configured
      const { initializeApp, getApps, getApp } = await import('firebase/app');
      const { getAuth, signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
      const { getFirestore, doc, setDoc, getDoc } = await import('firebase/firestore');

      const app = getApps().length === 0 ? initializeApp(settings.firebaseConfig) : getApp();
      const auth = getAuth(app);
      const db = getFirestore(app);
      const provider = new GoogleAuthProvider();

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user) throw new Error("Google Authentication failed");

      // Check if user document already exists in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      let profile: UserProfile;

      if (userDoc.exists()) {
        const data = userDoc.data();
        profile = {
          uid: user.uid,
          name: user.displayName || 'Anonymous User',
          email: user.email || '',
          photoURL: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
          joinDate: data.joinDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          readingHistory: data.readingHistory || [],
          favorites: data.favorites || [],
          daysActive: data.daysActive || 1,
          collectionsCreated: data.collectionsCreated || 5
        };
      } else {
        // Create new user profile
        profile = {
          uid: user.uid,
          name: user.displayName || 'Anonymous User',
          email: user.email || '',
          photoURL: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
          joinDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          readingHistory: [],
          favorites: [],
          daysActive: 1,
          collectionsCreated: 5
        };
        await setDoc(userDocRef, profile);
      }

      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(profile));
      return profile;
    } catch (error) {
      console.error("Firebase Auth error, falling back to Mock:", error);
      throw error; // Let UI handle error or suggest Mock
    }
  } else {
    // Simulate API network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const mockUser = createMockProfile();
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(mockUser));
    return mockUser;
  }
};

export const logoutUser = async (): Promise<void> => {
  const settings = getDevSettings();
  if (settings.useRealFirebase && settings.firebaseConfig) {
    try {
      const { initializeApp, getApps, getApp } = await import('firebase/app');
      const { getAuth, signOut } = await import('firebase/auth');
      const app = getApps().length === 0 ? initializeApp(settings.firebaseConfig) : getApp();
      const auth = getAuth(app);
      await signOut(auth);
    } catch (e) {
      console.error("Firebase Signout Error:", e);
    }
  }
  localStorage.removeItem(AUTH_USER_KEY);
};

export const getCurrentUser = (): UserProfile | null => {
  const stored = localStorage.getItem(AUTH_USER_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as UserProfile;
  } catch {
    return null;
  }
};

export const updateLocalUserProfile = (profile: UserProfile): void => {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(profile));
};

export const syncUserProfileToFirestore = async (profile: UserProfile): Promise<void> => {
  const settings = getDevSettings();
  if (settings.useRealFirebase && settings.firebaseConfig) {
    try {
      const { initializeApp, getApps, getApp } = await import('firebase/app');
      const { getFirestore, doc, updateDoc } = await import('firebase/firestore');
      const app = getApps().length === 0 ? initializeApp(settings.firebaseConfig) : getApp();
      const db = getFirestore(app);
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        name: profile.name,
        photoURL: profile.photoURL,
        readingHistory: profile.readingHistory,
        favorites: profile.favorites,
        daysActive: profile.daysActive,
        collectionsCreated: profile.collectionsCreated
      });
    } catch (e) {
      console.error("Error syncing profile to Firestore:", e);
    }
  }
};
