import type { UserProfile } from '../types';

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
  return new Promise((resolve, reject) => {
    const g = (window as any).google;
    if (!g || !g.accounts || !g.accounts.oauth2) {
      console.warn("Google Identity Services not loaded yet, falling back to Mock Profile.");
      // Fallback to mock login if script failed to load
      setTimeout(() => {
        const mockUser = createMockProfile();
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(mockUser));
        resolve(mockUser);
      }, 1000);
      return;
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '67186664663-0ni2vfij673hcb47qg6t48eq5jqjb0oo.apps.googleusercontent.com';

    try {
      const client = g.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            console.error("Google Auth response error:", tokenResponse.error);
            reject(new Error(tokenResponse.error));
            return;
          }

          try {
            // Fetch UserInfo details directly from Google's UserInfo API
            const res = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${tokenResponse.access_token}`);
            const userInfo = await res.json();

            if (!userInfo || !userInfo.sub) {
              throw new Error("Failed to retrieve user details from Google Cloud Console.");
            }

            const profile: UserProfile = {
              uid: userInfo.sub,
              name: userInfo.name || 'Anonymous User',
              email: userInfo.email || '',
              photoURL: userInfo.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
              joinDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
              readingHistory: [],
              favorites: [],
              daysActive: 1,
              collectionsCreated: 5
            };

            // Merge with local records if they match user id
            const stored = localStorage.getItem(AUTH_USER_KEY);
            if (stored) {
              try {
                const parsed = JSON.parse(stored) as UserProfile;
                if (parsed.uid === profile.uid) {
                  profile.readingHistory = parsed.readingHistory || [];
                  profile.favorites = parsed.favorites || [];
                  profile.daysActive = parsed.daysActive || 1;
                  profile.collectionsCreated = parsed.collectionsCreated || 5;
                }
              } catch (e) {
                console.error("Failed merging local profile:", e);
              }
            }

            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(profile));
            resolve(profile);
          } catch (fetchErr) {
            console.error("Failed to query Google UserInfo API:", fetchErr);
            reject(fetchErr);
          }
        },
      });

      client.requestAccessToken();
    } catch (err) {
      console.error("Google Client ID initialization error:", err);
      reject(err);
    }
  });
};

export const logoutUser = async (): Promise<void> => {
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

export const syncUserProfileToFirestore = async (_profile: UserProfile): Promise<void> => {
  // Bypassed: using local client authentication only
  return Promise.resolve();
};

