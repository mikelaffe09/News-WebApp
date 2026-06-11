import { supabase } from '../../lib/supabase';
import { throwIfSupabaseError } from '../../lib/supabaseErrors';
import { Article } from '../../types';
import { ARTICLE_WITH_RELATIONS_SELECT } from '../articles/articleConstants';

export interface CmsDashboardStats {
  published: number;
  drafts: number;
  inReview: number;
  subscribers: number;
  newsletters: number;
  scheduled: number;
}

export interface CmsDashboardData {
  stats: CmsDashboardStats;
  recentArticles: Article[];
}

export async function getCmsDashboardData(): Promise<CmsDashboardData> {
  const [pubRes, draftRes, reviewRes, scheduledRes, subRes, newsletterRes, articlesRes] = await Promise.all([
    supabase.from('articles').select('id', { count: 'exact' }).eq('status', 'published'),
    supabase.from('articles').select('id', { count: 'exact' }).eq('status', 'draft'),
    supabase.from('articles').select('id', { count: 'exact' }).eq('status', 'in_review'),
    supabase.from('articles').select('id', { count: 'exact' }).eq('status', 'scheduled'),
    supabase.from('subscriptions').select('id', { count: 'exact' }).eq('status', 'active'),
    supabase.from('newsletter_subscriptions').select('id', { count: 'exact' }).eq('status', 'active'),
    supabase.from('articles').select(ARTICLE_WITH_RELATIONS_SELECT).order('updated_at', { ascending: false }).limit(8),
  ]);

  throwIfSupabaseError(pubRes.error);
  throwIfSupabaseError(draftRes.error);
  throwIfSupabaseError(reviewRes.error);
  throwIfSupabaseError(scheduledRes.error);
  throwIfSupabaseError(subRes.error);
  throwIfSupabaseError(newsletterRes.error);
  throwIfSupabaseError(articlesRes.error);

  return {
    stats: {
      published: pubRes.count ?? 0,
      drafts: draftRes.count ?? 0,
      inReview: reviewRes.count ?? 0,
      scheduled: scheduledRes.count ?? 0,
      subscribers: subRes.count ?? 0,
      newsletters: newsletterRes.count ?? 0,
    },
    recentArticles: (articlesRes.data ?? []) as Article[],
  };
}
