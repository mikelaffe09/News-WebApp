import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { UserProfile } from '../types';
import {
  getCurrentSession,
  getPublicUserData,
  onAuthSessionChange,
  saveArticleForUser,
  signInWithPassword,
  signOut as signOutUser,
  signUpPublicUser,
  unsaveArticleForUser,
  updatePublicUserProfile,
} from '../features/auth/authService';

interface PublicAuthContextValue {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  savedIds: Set<string>;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  saveArticle: (articleId: string) => Promise<void>;
  unsaveArticle: (articleId: string) => Promise<void>;
  updateProfile: (updates: Partial<Pick<UserProfile, 'display_name'>>) => Promise<{ error: string | null }>;
}

const PublicAuthContext = createContext<PublicAuthContextValue | null>(null);

export function PublicAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  async function loadUserData(userId: string) {
    const data = await getPublicUserData(userId);
    setProfile(data.profile);
    setSavedIds(data.savedIds);
  }

  useEffect(() => {
    getCurrentSession().then(session => {
      setSession(session);
      if (session?.user) {
        loadUserData(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }).catch(() => {
      setLoading(false);
    });

    const subscription = onAuthSessionChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        loadUserData(session.user.id);
      } else {
        setProfile(null);
        setSavedIds(new Set());
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    return signInWithPassword(email, password);
  }

  async function signUp(email: string, password: string, displayName: string) {
    return signUpPublicUser(email, password, displayName);
  }

  async function signOut() {
    await signOutUser();
  }

  const saveArticle = useCallback(async (articleId: string) => {
    if (!session?.user) return;
    await saveArticleForUser(session.user.id, articleId);
    setSavedIds(prev => new Set([...prev, articleId]));
  }, [session]);

  const unsaveArticle = useCallback(async (articleId: string) => {
    if (!session?.user) return;
    await unsaveArticleForUser(session.user.id, articleId);
    setSavedIds(prev => { const next = new Set(prev); next.delete(articleId); return next; });
  }, [session]);

  const updateProfile = useCallback(async (updates: Partial<Pick<UserProfile, 'display_name'>>) => {
    if (!session?.user) return { error: 'Not signed in' };
    try {
      await updatePublicUserProfile(session.user.id, updates);
      setProfile(prev => prev ? { ...prev, ...updates } : prev);
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unable to update profile' };
    }
  }, [session]);

  return (
    <PublicAuthContext.Provider value={{
      session, user: session?.user ?? null, profile, savedIds, loading,
      signIn, signUp, signOut, saveArticle, unsaveArticle, updateProfile,
    }}>
      {children}
    </PublicAuthContext.Provider>
  );
}

export function usePublicAuth() {
  const ctx = useContext(PublicAuthContext);
  if (!ctx) throw new Error('usePublicAuth must be used within PublicAuthProvider');
  return ctx;
}
