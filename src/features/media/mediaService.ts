import { supabase } from '../../lib/supabase';
import { throwIfSupabaseError } from '../../lib/supabaseErrors';
import { MediaAsset } from '../../types';

export type MediaAssetInput = Pick<MediaAsset, 'url'> &
  Partial<Pick<MediaAsset, 'filename' | 'alt_text' | 'caption' | 'credit' | 'uploaded_by_email'>>;

export async function getMediaAssets(): Promise<MediaAsset[]> {
  const { data, error } = await supabase
    .from('media_assets')
    .select('*')
    .order('created_at', { ascending: false });

  throwIfSupabaseError(error);
  return (data ?? []) as MediaAsset[];
}

export async function uploadMediaAsset(input: MediaAssetInput): Promise<MediaAsset> {
  const { data, error } = await supabase.from('media_assets').insert(input).select().single();
  throwIfSupabaseError(error);
  return data as MediaAsset;
}

export async function deleteMediaAsset(id: string): Promise<void> {
  const { error } = await supabase.from('media_assets').delete().eq('id', id);
  throwIfSupabaseError(error);
}
