import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile, Quote, AppNotification, DevSettings } from '../types';
import { getCurrentUser, loginWithGoogle, logoutUser, updateLocalUserProfile, syncUserProfileToFirestore } from '../services/auth';
import { getQuotes, getFavorites, toggleFavorite, getNotifications, addNotification as dbAddNotification, markNotificationRead, getDevSettings, saveDevSettings, checkFirstQuoteAchievement, trackActivity } from '../services/db';

interface AppContextType {
  user: UserProfile | null;
  loading: boolean;
  view: string;
  previousView: string;
  quotes: Quote[];
  favorites: string[];
  notifications: AppNotification[];
  devSettings: DevSettings;
  toast: { message: string; type: 'success' | 'info' | 'error' } | null;
  devicePreview: boolean;
  darkMode: boolean;
  
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  hideToast: () => void;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  changeView: (newView: string) => void;
  goBack: () => void;
  toggleFavoriteQuote: (quoteId: string) => Promise<void>;
  addSystemNotification: (title: string, body: string, type: 'motivation' | 'quote' | 'goal' | 'mood' | 'achievement') => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  updateDevSettings: (settings: DevSettings) => void;
  setDevicePreview: (preview: boolean) => void;
  refreshUserData: () => Promise<void>;
  triggerQuoteReadTrack: (quoteId: string) => Promise<void>;
  setDarkMode: (dark: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [view, setView] = useState<string>('splash');
  const [previousView, setPreviousView] = useState<string>('home');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [devSettings, setDevSettings] = useState<DevSettings>(getDevSettings());
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [devicePreview, setDevicePreview] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('quoteverse_dark_mode') !== 'false';
  });

  // Toggle light-theme class on body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
    }
    localStorage.setItem('quoteverse_dark_mode', darkMode.toString());
  }, [darkMode]);

  // Initialize App
  useEffect(() => {
    const initApp = async () => {
      try {
        // Fetch all quotes
        const qList = await getQuotes();
        setQuotes(qList);
        
        // Check local session
        const sessionUser = getCurrentUser();
        if (sessionUser) {
          setUser(sessionUser);
          
          // Load dependencies for authenticated user
          const favs = await getFavorites(sessionUser.uid);
          setFavorites(favs);

          const list = await getNotifications(sessionUser.uid);
          setNotifications(list);

          // Update active days streak
          const newStreak = await trackActivity(sessionUser.uid);
          
          // Refresh locally
          const updated = {
            ...sessionUser,
            daysActive: newStreak
          };
          setUser(updated);
          updateLocalUserProfile(updated);

          // Navigate directly to home after splash animation
          setTimeout(() => {
            setView('home');
            setLoading(false);
          }, 2000);
        } else {
          // If no session, show onboarding after splash
          setTimeout(() => {
            setView('onboarding');
            setLoading(false);
          }, 2000);
        }
      } catch (err) {
        console.error("Initialization error:", err);
        showToast("Error initializing application, running offline mode.", "error");
        setTimeout(() => {
          setView('onboarding');
          setLoading(false);
        }, 2000);
      }
    };
    initApp();
  }, []);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    // Auto clear toast after 3 seconds
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const hideToast = () => setToast(null);

  const login = async () => {
    setLoading(true);
    try {
      const profile = await loginWithGoogle();
      setUser(profile);
      
      const favs = await getFavorites(profile.uid);
      setFavorites(favs);

      const list = await getNotifications(profile.uid);
      setNotifications(list);

      showToast(`Welcome back, ${profile.name}!`, "success");
      setView('home');
    } catch (error: any) {
      console.error(error);
      showToast("Authentication failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      setUser(null);
      setFavorites([]);
      setNotifications([]);
      showToast("Logged out successfully.", "info");
      setView('login');
    } catch (e) {
      showToast("Logout failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const changeView = (newView: string) => {
    setPreviousView(view);
    setView(newView);
  };

  const goBack = () => {
    setView(previousView);
  };

  const toggleFavoriteQuote = async (quoteId: string) => {
    if (!user) {
      showToast("Please sign in to save favorites.", "error");
      return;
    }
    try {
      const added = await toggleFavorite(user.uid, quoteId);
      
      let updatedFavs: string[];
      if (added) {
        updatedFavs = [...favorites, quoteId];
        showToast("Quote saved to Favorites!", "success");
      } else {
        updatedFavs = favorites.filter(id => id !== quoteId);
        showToast("Quote removed from Favorites.", "info");
      }
      setFavorites(updatedFavs);

      // Sync user profile local copy
      const updatedUser = {
        ...user,
        favorites: updatedFavs
      };
      setUser(updatedUser);
      updateLocalUserProfile(updatedUser);
    } catch (e) {
      showToast("Failed to update favorites.", "error");
    }
  };

  const triggerQuoteReadTrack = async (quoteId: string) => {
    if (!user) return;
    
    // Add to user reading history if not duplicate of last read
    const history = [...user.readingHistory];
    const isDup = history.length > 0 && history[0].quoteId === quoteId;
    
    if (!isDup) {
      history.unshift({
        quoteId,
        timestamp: new Date().toISOString()
      });
      
      const updatedUser = {
        ...user,
        readingHistory: history.slice(0, 30) // limit history
      };
      setUser(updatedUser);
      updateLocalUserProfile(updatedUser);
      await syncUserProfileToFirestore(updatedUser);
      
      // Check achievements
      await checkFirstQuoteAchievement(user.uid);
    }
  };

  const addSystemNotification = async (
    title: string, 
    body: string, 
    type: 'motivation' | 'quote' | 'goal' | 'mood' | 'achievement'
  ) => {
    if (!user) return;
    try {
      const notify = await dbAddNotification(user.uid, { title, body, type });
      setNotifications(prev => [notify, ...prev]);
    } catch (e) {
      console.error(e);
    }
  };

  const markNotificationAsRead = async (id: string) => {
    if (!user) return;
    try {
      await markNotificationRead(user.uid, id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const updateDevSettings = (settings: DevSettings) => {
    setDevSettings(settings);
    saveDevSettings(settings);
    showToast("Developer settings updated successfully.", "success");
    // Reload quotes if firestore config toggled
    getQuotes().then(setQuotes);
  };

  const refreshUserData = async () => {
    if (!user) return;
    const list = await getNotifications(user.uid);
    setNotifications(list);
    const favs = await getFavorites(user.uid);
    setFavorites(favs);
  };

  return (
    <AppContext.Provider value={{
      user,
      loading,
      view,
      previousView,
      quotes,
      favorites,
      notifications,
      devSettings,
      toast,
      devicePreview,
      darkMode,
      showToast,
      hideToast,
      login,
      logout,
      changeView,
      goBack,
      toggleFavoriteQuote,
      addSystemNotification,
      markNotificationAsRead,
      updateDevSettings,
      setDevicePreview,
      refreshUserData,
      triggerQuoteReadTrack,
      setDarkMode
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppContextProvider');
  }
  return context;
};
