import { supabase } from '../../lib/supabase';

export interface NewsletterSubscribeInput {
  email: string;
  name?: string | null;
  preferences?: {
    categories?: string[];
    frequency?: 'daily' | 'weekly';
  };
}

export interface NewsletterSubscribeResult {
  ok: boolean;
  message?: string;
}

export async function subscribeToNewsletter(input: NewsletterSubscribeInput): Promise<NewsletterSubscribeResult> {
  const { error } = await supabase.from('newsletter_subscriptions').insert({
    email: input.email.trim(),
    name: input.name?.trim() || null,
    preferences: input.preferences ?? {},
  });

  if (!error) return { ok: true };

  return {
    ok: false,
    message: error.code === '23505' ? "You're already subscribed!" : 'Something went wrong. Please try again.',
  };
}
