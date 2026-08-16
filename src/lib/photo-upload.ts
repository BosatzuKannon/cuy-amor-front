import type { ImagePickerAsset } from 'expo-image-picker';
import { Blob as ExpoBlob } from 'expo-blob';
import { File } from 'expo-file-system';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

const PHOTO_BUCKET = 'cuy-amor-storage';

export async function uploadProfilePhoto(
  session: Session,
  asset: ImagePickerAsset,
): Promise<string> {
  const mimeType = asset.mimeType ?? 'image/jpeg';
  const extension = (mimeType.split('/')[1] ?? 'jpg').replace('jpeg', 'jpg');
  const path = `users/${session.user.id}/${Date.now()}.${extension}`;

  const file = new File(asset.uri);
  const buffer = await file.arrayBuffer();
  const uploadBody = new ExpoBlob([buffer], { type: mimeType });

  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, uploadBody, { contentType: mimeType });

  if (error) {
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);

  return publicUrl;
}