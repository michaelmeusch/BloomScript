import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '@clerk/expo';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { AuthorProfile } from '@/types';

const STORAGE_KEY = '@CAS:author_profile';

function scopedKey(userId: string | null | undefined) {
  return userId ? `${STORAGE_KEY}:${userId}` : STORAGE_KEY;
}


interface AuthorProfileContextValue {
  profile: AuthorProfile | null;
  loading: boolean;
  saveProfile: (p: AuthorProfile) => void;
  clearProfile: () => void;
}

const AuthorProfileContext = createContext<AuthorProfileContextValue | null>(null);

export function AuthorProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const userId = user?.id ?? null;
  const [profile, setProfile] = useState<AuthorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const isFirst = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevUserId = useRef<string | null>(null);

  useEffect(() => {
    if (prevUserId.current !== userId) {
      isFirst.current = true;
      prevUserId.current = userId;
    }

    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    AsyncStorage.getItem(scopedKey(userId))
      .then((raw) => {
        setProfile(raw ? (JSON.parse(raw) as AuthorProfile) : null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (userId) {
        if (profile) {
          AsyncStorage.setItem(scopedKey(userId), JSON.stringify(profile)).catch(() => {});
        } else {
          AsyncStorage.removeItem(scopedKey(userId)).catch(() => {});
        }
      }
    }, 400);
  }, [profile, userId]);

  const saveProfile = useCallback((p: AuthorProfile) => {
    setProfile(p);
  }, []);

  const clearProfile = useCallback(() => {
    setProfile(null);
  }, []);

  return (
    <AuthorProfileContext.Provider value={{ profile, loading, saveProfile, clearProfile }}>
      {children}
    </AuthorProfileContext.Provider>
  );
}

export function useAuthorProfile() {
  const ctx = useContext(AuthorProfileContext);
  if (!ctx) throw new Error('useAuthorProfile must be used within AuthorProfileProvider');
  return ctx;
}
