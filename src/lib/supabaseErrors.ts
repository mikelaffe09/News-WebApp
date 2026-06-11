import type { PostgrestError } from '@supabase/supabase-js';

export function throwIfSupabaseError(error: PostgrestError | null): void {
  if (error) throw new Error(error.message);
}
