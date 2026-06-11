import { supabase } from '../../lib/supabase';
import { throwIfSupabaseError } from '../../lib/supabaseErrors';
import { Article, Category } from '../../types';
import { ARTICLE_WITH_RELATIONS_SELECT } from '../articles/articleConstants';
import { getPublishedArticles, getTrendingArticles } from '../articles/articleService';
import { getCategories } from '../categories/categoryService';
import {
  HomepageArticleOption,
  HomepageCategoryOption,
  HomepageCurationData,
  HomepageData,
  HomepageModuleWithSelections,
} from './homepageTypes';

const MODULE_SELECT = '*, article:articles(id,title,slug), category:categories(id,name,slug)';

export async function getHomepageData(): Promise<HomepageData> {
  const [articles, categories, trending] = await Promise.all([
    getPublishedArticles(20),
    getCategories({ orderBy: 'sort_order', limit: 6 }),
    getTrendingArticles(7, 8),
  ]);

  const breaking = articles.filter(article => article.is_breaking);
  const categoryArticles: Record<string, Article[]> = {};

  await Promise.all(
    categories.slice(0, 4).map(async category => {
      const { data, error } = await supabase
        .from('articles')
        .select(ARTICLE_WITH_RELATIONS_SELECT)
        .eq('status', 'published')
        .eq('category_id', category.id)
        .order('published_at', { ascending: false })
        .limit(4);

      throwIfSupabaseError(error);
      categoryArticles[category.slug] = (data ?? []) as Article[];
    }),
  );

  return {
    breaking,
    hero: articles.filter(article => !article.is_breaking)[0] ?? articles[0] ?? null,
    featured: articles.slice(1, 5),
    latest: articles.slice(0, 10),
    trending,
    categories,
    categoryArticles,
  };
}

export async function getHomepageCurationData(): Promise<HomepageCurationData> {
  const [moduleRes, articleRes, categoryRes] = await Promise.all([
    supabase.from('homepage_modules').select(MODULE_SELECT).order('position'),
    supabase
      .from('articles')
      .select('id,title,slug')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(50),
    supabase.from('categories').select('*').order('name'),
  ]);

  throwIfSupabaseError(moduleRes.error);
  throwIfSupabaseError(articleRes.error);
  throwIfSupabaseError(categoryRes.error);

  return {
    modules: (moduleRes.data ?? []) as HomepageModuleWithSelections[],
    articles: (articleRes.data ?? []) as HomepageArticleOption[],
    categories: (categoryRes.data ?? []) as Category[],
  };
}

export async function updateHomepageModuleActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from('homepage_modules').update({ is_active: isActive }).eq('id', id);
  throwIfSupabaseError(error);
}

export async function updateHomepageModulePositions(updates: Array<{ id: string; position: number }>): Promise<void> {
  const results = await Promise.all(
    updates.map(update =>
      supabase.from('homepage_modules').update({ position: update.position }).eq('id', update.id),
    ),
  );

  const failed = results.find(result => result.error);
  if (failed) throwIfSupabaseError(failed.error);
}

export async function updateHomepageModuleField(
  id: string,
  field: 'article_id' | 'category_id',
  value: string | null,
): Promise<void> {
  const { error } = await supabase.from('homepage_modules').update({ [field]: value || null }).eq('id', id);
  throwIfSupabaseError(error);
}

export async function updateHomepageModuleTitle(id: string, title: string): Promise<void> {
  const { error } = await supabase.from('homepage_modules').update({ title: title || null }).eq('id', id);
  throwIfSupabaseError(error);
}

export function findHomepageArticleOption(
  articles: HomepageArticleOption[],
  id: string | null,
): HomepageArticleOption | null {
  return articles.find(article => article.id === id) ?? null;
}

export function findHomepageCategoryOption(
  categories: HomepageCategoryOption[],
  id: string | null,
): HomepageCategoryOption | null {
  return categories.find(category => category.id === id) ?? null;
}
