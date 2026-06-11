import { supabase } from '../../lib/supabase';
import { throwIfSupabaseError } from '../../lib/supabaseErrors';
import { Author } from '../../types';
import { AuthorInput } from './authorTypes';

export async function getAuthors(): Promise<Author[]> {
  const { data, error } = await supabase.from('authors').select('*').order('name');
  throwIfSupabaseError(error);
  return (data ?? []) as Author[];
}

export async function getAuthorBySlug(slug: string): Promise<Author | null> {
  const { data, error } = await supabase
    .from('authors')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  throwIfSupabaseError(error);
  return (data ?? null) as Author | null;
}

export async function createAuthor(input: AuthorInput): Promise<Author> {
  const { data, error } = await supabase.from('authors').insert(input).select().single();
  throwIfSupabaseError(error);
  return data as Author;
}

export async function updateAuthor(id: string, input: AuthorInput): Promise<void> {
  const { error } = await supabase.from('authors').update(input).eq('id', id);
  throwIfSupabaseError(error);
}

export async function deleteAuthor(id: string): Promise<void> {
  const { error } = await supabase.from('authors').delete().eq('id', id);
  throwIfSupabaseError(error);
}
