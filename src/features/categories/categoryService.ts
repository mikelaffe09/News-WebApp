import { supabase } from '../../lib/supabase';
import { throwIfSupabaseError } from '../../lib/supabaseErrors';
import { Category } from '../../types';
import { CategoryInput, CategoryQueryOptions } from './categoryTypes';

export async function getCategories(options: CategoryQueryOptions = {}): Promise<Category[]> {
  let query = supabase.from('categories').select('*');

  if (options.orderBy === 'name') {
    query = query.order('name');
  } else if (options.orderBy === 'sort_order_then_name') {
    query = query.order('sort_order').order('name');
  } else {
    query = query.order('sort_order');
  }

  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  throwIfSupabaseError(error);
  return (data ?? []) as Category[];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  throwIfSupabaseError(error);
  return (data ?? null) as Category | null;
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert(input)
    .select()
    .single();

  throwIfSupabaseError(error);
  return data as Category;
}

export async function updateCategory(id: string, input: CategoryInput): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .update(input)
    .eq('id', id);

  throwIfSupabaseError(error);
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  throwIfSupabaseError(error);
}
