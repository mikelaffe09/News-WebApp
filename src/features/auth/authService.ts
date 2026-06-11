import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { throwIfSupabaseError } from '../../lib/supabaseErrors';
import { CmsProfile, UserProfile } from '../../types';

export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  return data.session;
}

export function onAuthSessionChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
  return supabase.auth.onAuthStateChange(callback).data.subscription;
}

export async function signInWithPassword(email: string, password: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error?.message ?? null };
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function getCmsProfile(userId: string): Promise<CmsProfile | null> {
  const { data, error } = await supabase
    .from('cms_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  throwIfSupabaseError(error);
  return (data ?? null) as CmsProfile | null;
}

export async function signUpCmsUser(
  email: string,
  password: string,
  displayName: string,
): Promise<{ error: string | null }> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };

  if (data.user) {
    const { error: profileError } = await supabase.from('cms_profiles').insert({
      id: data.user.id,
      email,
      display_name: displayName,
      role: 'writer',
    });

    if (profileError) return { error: profileError.message };
  }

  return { error: null };
}

export async function getPublicUserData(userId: string): Promise<{
  profile: UserProfile | null;
  savedIds: Set<string>;
}> {
  const [profileRes, savedRes] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('saved_articles').select('article_id').eq('user_id', userId),
  ]);

  throwIfSupabaseError(profileRes.error);
  throwIfSupabaseError(savedRes.error);

  return {
    profile: (profileRes.data ?? null) as UserProfile | null,
    savedIds: new Set(((savedRes.data ?? []) as Array<{ article_id: string }>).map(saved => saved.article_id)),
  };
}

export async function signUpPublicUser(
  email: string,
  password: string,
  displayName: string,
): Promise<{ error: string | null }> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };

  if (data.user) {
    const { error: profileError } = await supabase.from('user_profiles').insert({
      id: data.user.id,
      email,
      display_name: displayName.trim() || null,
    });

    if (profileError) return { error: profileError.message };
  }

  return { error: null };
}

export async function saveArticleForUser(userId: string, articleId: string): Promise<void> {
  const { error } = await supabase.from('saved_articles').insert({
    user_id: userId,
    article_id: articleId,
  });
  throwIfSupabaseError(error);
}

export async function unsaveArticleForUser(userId: string, articleId: string): Promise<void> {
  const { error } = await supabase
    .from('saved_articles')
    .delete()
    .eq('user_id', userId)
    .eq('article_id', articleId);

  throwIfSupabaseError(error);
}

export async function updatePublicUserProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, 'display_name'>>,
): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId);

  throwIfSupabaseError(error);
}
