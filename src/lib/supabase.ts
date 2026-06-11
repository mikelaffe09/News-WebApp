import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function getRequiredPublicEnv(name: string, value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Missing ${name}. Add it to your local .env file as a public VITE_ value.`);
  }

  return value;
}

function getSupabaseUrl(): string {
  const value = getRequiredPublicEnv('VITE_SUPABASE_URL', supabaseUrl);

  try {
    new URL(value);
  } catch {
    throw new Error('VITE_SUPABASE_URL must be a valid Supabase project URL.');
  }

  return value;
}

export const supabase = createClient(
  getSupabaseUrl(),
  getRequiredPublicEnv('VITE_SUPABASE_ANON_KEY', supabaseAnonKey),
);
