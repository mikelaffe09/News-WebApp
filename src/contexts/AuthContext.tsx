import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { CmsProfile } from '../types';
import {
  getCmsProfile,
  getCurrentSession,
  onAuthSessionChange,
  signInWithPassword,
  signOut as signOutUser,
  signUpCmsUser,
} from '../features/auth/authService';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: CmsProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<CmsProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId: string) {
    const data = await getCmsProfile(userId);
    setProfile(data);
  }

  useEffect(() => {
    getCurrentSession().then(session => {
      setSession(session);
      if (session?.user) {
        loadProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }).catch(() => {
      setLoading(false);
    });

    const subscription = onAuthSessionChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        (async () => { await loadProfile(session.user.id); })();
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    return signInWithPassword(email, password);
  }

  async function signUp(email: string, password: string, displayName: string) {
    return signUpCmsUser(email, password, displayName);
  }

  async function signOut() {
    await signOutUser();
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
