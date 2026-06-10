import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

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
    const [profileRes, savedRes] = await Promise.all([
      supabase.from('user_profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('saved_articles').select('article_id').eq('user_id', userId),
    ]);
    setProfile(profileRes.data ?? null);
    setSavedIds(new Set((savedRes.data ?? []).map((s: { article_id: string }) => s.article_id)));
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadUserData(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }

  async function signUp(email: string, password: string, displayName: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (data.user) {
      await supabase.from('user_profiles').insert({
        id: data.user.id,
        email,
        display_name: displayName.trim() || null,
      });
    }
    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  const saveArticle = useCallback(async (articleId: string) => {
    if (!session?.user) return;
    const { error } = await supabase.from('saved_articles').insert({
      user_id: session.user.id,
      article_id: articleId,
    });
    if (!error) setSavedIds(prev => new Set([...prev, articleId]));
  }, [session]);

  const unsaveArticle = useCallback(async (articleId: string) => {
    if (!session?.user) return;
    const { error } = await supabase.from('saved_articles')
      .delete()
      .eq('user_id', session.user.id)
      .eq('article_id', articleId);
    if (!error) setSavedIds(prev => { const next = new Set(prev); next.delete(articleId); return next; });
  }, [session]);

  const updateProfile = useCallback(async (updates: Partial<Pick<UserProfile, 'display_name'>>) => {
    if (!session?.user) return { error: 'Not signed in' };
    const { error } = await supabase.from('user_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', session.user.id);
    if (error) return { error: error.message };
    setProfile(prev => prev ? { ...prev, ...updates } : prev);
    return { error: null };
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
