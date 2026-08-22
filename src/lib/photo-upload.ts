import type { ImagePickerAsset } from 'expo-image-picker';
import { Blob as ExpoBlob } from 'expo-blob';
import { File } from 'expo-file-system';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

export const PROFILE_PHOTO_BUCKET =
  process.env.EXPO_PUBLIC_SUPABASE_BUCKET ?? 'profile_images';

export async function uploadImageToBucket(
  session: Session,
  asset: ImagePickerAsset,
): Promise<string> {
  const mimeType = asset.mimeType ?? 'image/jpeg';
  const extension = (mimeType.split('/')[1] ?? 'jpg').replace('jpeg', 'jpg');
  const path = `users/${session.user.id}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${extension}`;

  const file = new File(asset.uri);
  const buffer = await file.arrayBuffer();
  const uploadBody = new ExpoBlob([buffer], { type: mimeType });

  const { error } = await supabase.storage
    .from(PROFILE_PHOTO_BUCKET)
    .upload(path, uploadBody, { contentType: mimeType });

  if (error) {
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(PROFILE_PHOTO_BUCKET).getPublicUrl(path);

  return publicUrl;
}

export async function uploadProfilePhoto(
  session: Session,
  asset: ImagePickerAsset,
): Promise<string> {
  return uploadImageToBucket(session, asset);
}

export function storagePathFromPublicUrl(publicUrl: string): string | null {
  const marker = `/object/public/${PROFILE_PHOTO_BUCKET}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) {
    return null;
  }
  return publicUrl.slice(index + marker.length);
}

export async function removeImageFromBucket(publicUrl: string): Promise<void> {
  const path = storagePathFromPublicUrl(publicUrl);
  if (!path) {
    return;
  }
  await supabase.storage.from(PROFILE_PHOTO_BUCKET).remove([path]);
}