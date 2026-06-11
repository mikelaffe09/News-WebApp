import { supabase } from '../../lib/supabase';
import { throwIfSupabaseError } from '../../lib/supabaseErrors';
import { Article, ArticleRevision, ArticleStatus, WorkflowComment } from '../../types';
import { ARTICLE_WITH_RELATIONS_SELECT, ARTICLE_WITH_TAGS_SELECT } from './articleConstants';
import { ArticleMutation, ArticleSearchSort, PaginatedArticles } from './articleTypes';

interface ArticleIdRow {
  article_id: string;
}

export async function getPublishedArticles(limit = 20): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_WITH_RELATIONS_SELECT)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit);

  throwIfSupabaseError(error);
  return (data ?? []) as Article[];
}

export async function getTrendingArticles(days = 7, limit = 8): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_WITH_RELATIONS_SELECT)
    .eq('status', 'published')
    .gte('published_at', new Date(Date.now() - days * 86400000).toISOString())
    .order('view_count', { ascending: false })
    .limit(limit);

  throwIfSupabaseError(error);
  return (data ?? []) as Article[];
}

export async function getPublishedArticlesByCategory(
  categoryId: string,
  page: number,
  pageSize: number,
): Promise<PaginatedArticles> {
  const from = page * pageSize;
  const { data, error, count } = await supabase
    .from('articles')
    .select(ARTICLE_WITH_RELATIONS_SELECT, { count: 'exact' })
    .eq('status', 'published')
    .eq('category_id', categoryId)
    .order('published_at', { ascending: false })
    .range(from, from + pageSize - 1);

  throwIfSupabaseError(error);
  return { articles: (data ?? []) as Article[], total: count ?? 0 };
}

export async function getPublishedArticlesByAuthor(
  authorId: string,
  page: number,
  pageSize: number,
): Promise<PaginatedArticles> {
  const from = page * pageSize;
  const { data, error, count } = await supabase
    .from('articles')
    .select(ARTICLE_WITH_RELATIONS_SELECT, { count: 'exact' })
    .eq('status', 'published')
    .eq('author_id', authorId)
    .order('published_at', { ascending: false })
    .range(from, from + pageSize - 1);

  throwIfSupabaseError(error);
  return { articles: (data ?? []) as Article[], total: count ?? 0 };
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_WITH_TAGS_SELECT)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  throwIfSupabaseError(error);
  return (data ?? null) as Article | null;
}

export async function getRelatedArticles(article: Article, limit = 4): Promise<Article[]> {
  const tagIds = (article.article_tags ?? [])
    .map(tag => tag.tag_id)
    .filter((tagId): tagId is string => Boolean(tagId));
  let relatedArticles: Article[] = [];

  if (tagIds.length > 0) {
    const { data: tagRows, error: tagRowsError } = await supabase
      .from('article_tags')
      .select('article_id')
      .in('tag_id', tagIds)
      .neq('article_id', article.id)
      .limit(20);

    throwIfSupabaseError(tagRowsError);

    const tagArticleIds = [...new Set(((tagRows ?? []) as ArticleIdRow[]).map(row => row.article_id))];

    if (tagArticleIds.length > 0) {
      const { data: tagRelated, error: tagRelatedError } = await supabase
        .from('articles')
        .select(ARTICLE_WITH_RELATIONS_SELECT)
        .eq('status', 'published')
        .in('id', tagArticleIds)
        .order('published_at', { ascending: false })
        .limit(limit);

      throwIfSupabaseError(tagRelatedError);
      relatedArticles = (tagRelated ?? []) as Article[];
    }
  }

  if (relatedArticles.length < limit && article.category_id) {
    const existing = new Set(relatedArticles.map(related => related.id));
    const { data: categoryRelated, error } = await supabase
      .from('articles')
      .select(ARTICLE_WITH_RELATIONS_SELECT)
      .eq('status', 'published')
      .eq('category_id', article.category_id)
      .neq('id', article.id)
      .order('published_at', { ascending: false })
      .limit(limit * 2);

    throwIfSupabaseError(error);

    const extras = ((categoryRelated ?? []) as Article[]).filter(related => !existing.has(related.id));
    relatedArticles = [...relatedArticles, ...extras].slice(0, limit);
  }

  return relatedArticles;
}

export async function recordArticleView(article: Article, sessionId: string): Promise<void> {
  await Promise.allSettled([
    supabase.from('analytics_events').insert({
      event_type: 'article_view',
      article_id: article.id,
      category_id: article.category_id,
      author_id: article.author_id,
      session_id: sessionId,
    }),
    supabase
      .from('articles')
      .update({ view_count: article.view_count + 1 })
      .eq('id', article.id),
  ]);
}

export async function searchPublishedArticles(params: {
  query: string;
  categoryId?: string;
  sortBy: ArticleSearchSort;
  limit?: number;
}): Promise<Article[]> {
  const trimmed = params.query.trim();
  let request = supabase
    .from('articles')
    .select(ARTICLE_WITH_RELATIONS_SELECT)
    .eq('status', 'published');

  if (trimmed.length >= 3) {
    request = request.textSearch('search_vector', trimmed, { type: 'websearch', config: 'english' });
  } else {
    request = request.or(`title.ilike.%${trimmed}%,subtitle.ilike.%${trimmed}%,excerpt.ilike.%${trimmed}%`);
  }

  if (params.categoryId) request = request.eq('category_id', params.categoryId);

  if (params.sortBy === 'oldest') {
    request = request.order('published_at', { ascending: true });
  } else if (params.sortBy === 'popular') {
    request = request.order('view_count', { ascending: false });
  } else {
    request = request.order('published_at', { ascending: false });
  }

  const { data, error } = await request.limit(params.limit ?? 24);
  throwIfSupabaseError(error);
  return (data ?? []) as Article[];
}

export async function recordSearchQuery(query: string, resultsCount: number): Promise<void> {
  const trimmed = query.trim();
  if (!trimmed) return;
  await supabase.from('search_queries').insert({ query: trimmed, results_count: resultsCount });
}

export async function getPublishedArticlesByIds(ids: string[]): Promise<Article[]> {
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_WITH_RELATIONS_SELECT)
    .in('id', ids)
    .eq('status', 'published');

  throwIfSupabaseError(error);
  const articles = (data ?? []) as Article[];
  return ids
    .map(id => articles.find(article => article.id === id))
    .filter((article): article is Article => Boolean(article));
}

export async function getTrendingSearches(days = 7, limit = 8): Promise<string[]> {
  const { data, error } = await supabase
    .from('search_queries')
    .select('query')
    .gte('created_at', new Date(Date.now() - days * 86400000).toISOString())
    .order('created_at', { ascending: false })
    .limit(50);

  throwIfSupabaseError(error);

  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as Array<{ query: string }>) {
    counts[row.query] = (counts[row.query] ?? 0) + 1;
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([query]) => query);
}

export async function getCmsArticles(): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_WITH_RELATIONS_SELECT)
    .order('updated_at', { ascending: false })
    .limit(100);

  throwIfSupabaseError(error);
  return (data ?? []) as Article[];
}

export async function getArticleById(id: string): Promise<Article | null> {
  const { data, error } = await supabase.from('articles').select('*').eq('id', id).maybeSingle();
  throwIfSupabaseError(error);
  return (data ?? null) as Article | null;
}

export async function createArticle(input: ArticleMutation): Promise<string> {
  const { data, error } = await supabase.from('articles').insert(input).select('id').single();
  throwIfSupabaseError(error);
  return (data as { id: string }).id;
}

export async function updateArticle(id: string, input: ArticleMutation): Promise<void> {
  const { error } = await supabase.from('articles').update(input).eq('id', id);
  throwIfSupabaseError(error);
}

export async function deleteArticle(id: string): Promise<void> {
  const { error } = await supabase.from('articles').delete().eq('id', id);
  throwIfSupabaseError(error);
}

export async function publishArticle(id: string): Promise<ArticleMutation> {
  const updates: ArticleMutation = {
    status: 'published',
    published_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  await updateArticle(id, updates);
  return updates;
}

export async function archiveArticle(id: string): Promise<void> {
  await updateArticle(id, { status: 'archived', updated_at: new Date().toISOString() });
}

export async function autosaveArticle(
  id: string,
  input: Pick<ArticleMutation, 'body' | 'title' | 'subtitle'>,
): Promise<void> {
  await updateArticle(id, { ...input, updated_at: new Date().toISOString() });
}

export async function createArticleRevision(input: {
  article_id: string;
  title: string;
  subtitle: string | null;
  body: string;
  status: ArticleStatus;
  changed_by_email: string | null;
}): Promise<void> {
  const { error } = await supabase.from('article_revisions').insert(input);
  throwIfSupabaseError(error);
}

export async function getArticleRevisions(articleId: string): Promise<ArticleRevision[]> {
  const { data, error } = await supabase
    .from('article_revisions')
    .select('*')
    .eq('article_id', articleId)
    .order('created_at', { ascending: false })
    .limit(20);

  throwIfSupabaseError(error);
  return (data ?? []) as ArticleRevision[];
}

export async function getWorkflowComments(articleId: string): Promise<WorkflowComment[]> {
  const { data, error } = await supabase
    .from('workflow_comments')
    .select('*')
    .eq('article_id', articleId)
    .order('created_at', { ascending: true });

  throwIfSupabaseError(error);
  return (data ?? []) as WorkflowComment[];
}

export async function createWorkflowComment(input: {
  article_id: string;
  author_email: string;
  comment: string;
  action: WorkflowComment['action'];
}): Promise<void> {
  const { error } = await supabase.from('workflow_comments').insert(input);
  throwIfSupabaseError(error);
}
