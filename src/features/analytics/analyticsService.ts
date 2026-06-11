import { supabase } from '../../lib/supabase';
import { throwIfSupabaseError } from '../../lib/supabaseErrors';
import { Category } from '../../types';

export interface TopArticle {
  id: string;
  title: string;
  slug: string;
  view_count: number;
  published_at: string | null;
}

export interface TopCategory {
  name: string;
  color: string;
  article_count: number;
  total_views: number;
}

export interface TopAuthor {
  name: string;
  slug: string;
  article_count: number;
  total_views: number;
}

export interface SearchTerm {
  query: string;
  count: number;
  last_searched: string;
}

export interface DailyStat {
  date: string;
  views: number;
}

export interface AnalyticsDashboardData {
  totalViews: number;
  totalArticles: number;
  subscribers: number;
  newsletters: number;
  paywallImpressions: number;
  subscriptions: number;
  topArticles: TopArticle[];
  topCategories: TopCategory[];
  topAuthors: TopAuthor[];
  searchTerms: SearchTerm[];
  dailyStats: DailyStat[];
}

interface ArticleViewCountRow {
  view_count: number | null;
}

interface CategoryJoinRow {
  category: Pick<Category, 'name' | 'color'> | null;
  view_count?: number | null;
}

interface AuthorJoinRow {
  author: { name: string; slug: string } | null;
  view_count: number | null;
}

interface SearchQueryRow {
  query: string;
  created_at: string;
}

interface AnalyticsEventRow {
  created_at: string;
}

export async function getAnalyticsDashboardData(): Promise<AnalyticsDashboardData> {
  const [
    viewsRes,
    articleCountRes,
    subRes,
    newsletterRes,
    paywallRes,
    subscriptionRes,
    topArticlesRes,
    categoryCountRes,
    authorRes,
    searchRes,
    dailyRes,
  ] = await Promise.all([
    supabase.from('articles').select('view_count').eq('status', 'published'),
    supabase.from('articles').select('id', { count: 'exact' }).eq('status', 'published'),
    supabase.from('subscriptions').select('id', { count: 'exact' }).eq('status', 'active'),
    supabase.from('newsletter_subscriptions').select('id', { count: 'exact' }).eq('status', 'active'),
    supabase.from('analytics_events').select('id', { count: 'exact' }).eq('event_type', 'paywall_impression'),
    supabase.from('analytics_events').select('id', { count: 'exact' }).eq('event_type', 'subscription_complete'),
    supabase
      .from('articles')
      .select('id,title,slug,view_count,published_at')
      .eq('status', 'published')
      .order('view_count', { ascending: false })
      .limit(10),
    supabase.from('articles').select('category:categories(name,color)').eq('status', 'published').not('category_id', 'is', null),
    supabase.from('articles').select('author:authors(name,slug), view_count').eq('status', 'published').not('author_id', 'is', null),
    supabase.from('search_queries').select('query,created_at').order('created_at', { ascending: false }).limit(200),
    supabase
      .from('analytics_events')
      .select('created_at')
      .eq('event_type', 'article_view')
      .gte('created_at', new Date(Date.now() - 14 * 86400000).toISOString()),
  ]);

  [
    viewsRes.error,
    articleCountRes.error,
    subRes.error,
    newsletterRes.error,
    paywallRes.error,
    subscriptionRes.error,
    topArticlesRes.error,
    categoryCountRes.error,
    authorRes.error,
    searchRes.error,
    dailyRes.error,
  ].forEach(error => throwIfSupabaseError(error));

  const categoryViewsRes = await supabase
    .from('articles')
    .select('category:categories(name,color), view_count')
    .eq('status', 'published')
    .not('category_id', 'is', null);
  throwIfSupabaseError(categoryViewsRes.error);

  return {
    totalViews: ((viewsRes.data ?? []) as ArticleViewCountRow[]).reduce((sum, article) => sum + (article.view_count ?? 0), 0),
    totalArticles: articleCountRes.count ?? 0,
    subscribers: subRes.count ?? 0,
    newsletters: newsletterRes.count ?? 0,
    paywallImpressions: paywallRes.count ?? 0,
    subscriptions: subscriptionRes.count ?? 0,
    topArticles: (topArticlesRes.data ?? []) as TopArticle[],
    topCategories: aggregateCategories(
      (categoryCountRes.data ?? []) as CategoryJoinRow[],
      (categoryViewsRes.data ?? []) as CategoryJoinRow[],
    ),
    topAuthors: aggregateAuthors((authorRes.data ?? []) as AuthorJoinRow[]),
    searchTerms: aggregateSearchTerms((searchRes.data ?? []) as SearchQueryRow[]),
    dailyStats: aggregateDailyStats((dailyRes.data ?? []) as AnalyticsEventRow[]),
  };
}

function aggregateCategories(countRows: CategoryJoinRow[], viewRows: CategoryJoinRow[]): TopCategory[] {
  const categoryMap: Record<string, TopCategory> = {};

  for (const row of countRows) {
    const category = row.category;
    if (!category?.name) continue;
    categoryMap[category.name] = categoryMap[category.name] ?? {
      name: category.name,
      color: category.color,
      article_count: 0,
      total_views: 0,
    };
    categoryMap[category.name].article_count += 1;
  }

  for (const row of viewRows) {
    const category = row.category;
    if (!category?.name) continue;
    categoryMap[category.name] = categoryMap[category.name] ?? {
      name: category.name,
      color: category.color,
      article_count: 0,
      total_views: 0,
    };
    categoryMap[category.name].total_views += row.view_count ?? 0;
  }

  return Object.values(categoryMap).sort((a, b) => b.total_views - a.total_views).slice(0, 8);
}

function aggregateAuthors(rows: AuthorJoinRow[]): TopAuthor[] {
  const authorMap: Record<string, TopAuthor> = {};

  for (const row of rows) {
    const author = row.author;
    if (!author?.name) continue;
    authorMap[author.slug] = authorMap[author.slug] ?? {
      name: author.name,
      slug: author.slug,
      article_count: 0,
      total_views: 0,
    };
    authorMap[author.slug].article_count += 1;
    authorMap[author.slug].total_views += row.view_count ?? 0;
  }

  return Object.values(authorMap).sort((a, b) => b.total_views - a.total_views).slice(0, 8);
}

function aggregateSearchTerms(rows: SearchQueryRow[]): SearchTerm[] {
  const termMap: Record<string, { count: number; last_searched: string }> = {};

  for (const row of rows) {
    const query = row.query.toLowerCase().trim();
    if (!query) continue;
    termMap[query] = termMap[query] ?? { count: 0, last_searched: row.created_at };
    termMap[query].count += 1;
    if (row.created_at > termMap[query].last_searched) termMap[query].last_searched = row.created_at;
  }

  return Object.entries(termMap)
    .map(([query, value]) => ({ query, ...value }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function aggregateDailyStats(rows: AnalyticsEventRow[]): DailyStat[] {
  const dayMap: Record<string, number> = {};

  for (const row of rows) {
    const day = row.created_at.slice(0, 10);
    dayMap[day] = (dayMap[day] ?? 0) + 1;
  }

  return Array.from({ length: 14 }, (_, index) => {
    const date = new Date(Date.now() - (13 - index) * 86400000);
    const key = date.toISOString().slice(0, 10);
    return { date: key, views: dayMap[key] ?? 0 };
  });
}
