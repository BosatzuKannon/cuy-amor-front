import type { ImagePickerAsset } from 'expo-image-picker';
import { Blob as ExpoBlob } from 'expo-blob';
import { File } from 'expo-file-system';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

export const CHAT_MEDIA_BUCKET =
  process.env.EXPO_PUBLIC_SUPABASE_BUCKET ?? 'cuy-amor-storage';

export const MAX_CHAT_PHOTO_BYTES = 2 * 1024 * 1024;
export const MAX_VOICE_DURATION_MS = 10_000;

function randomSuffix(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function uploadChatMedia(
  session: Session,
  matchId: string,
  path: string,
  body: ExpoBlob,
  contentType: string,
): Promise<string> {
  const { error } = await supabase.storage
    .from(CHAT_MEDIA_BUCKET)
    .upload(path, body, { contentType });

  if (error) {
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(CHAT_MEDIA_BUCKET).getPublicUrl(path);

  return publicUrl;
}

export function photoExceedsLimit(asset: ImagePickerAsset): boolean {
  if (typeof asset.fileSize === 'number') {
    return asset.fileSize > MAX_CHAT_PHOTO_BYTES;
  }
  return false;
}

export async function uploadChatPhoto(
  session: Session,
  matchId: string,
  asset: ImagePickerAsset,
): Promise<string> {
  const mimeType = asset.mimeType ?? 'image/jpeg';
  const extension = (mimeType.split('/')[1] ?? 'jpg').replace('jpeg', 'jpg');
  const path = `chat/${matchId}/${session.user.id}-${randomSuffix()}.${extension}`;

  const file = new File(asset.uri);
  const buffer = await file.arrayBuffer();
  const body = new ExpoBlob([buffer], { type: mimeType });

  return uploadChatMedia(session, matchId, path, body, mimeType);
}

export async function uploadChatVoiceNote(
  session: Session,
  matchId: string,
  localUri: string,
  mimeType = 'audio/m4a',
): Promise<string> {
  const extension = (mimeType.split('/')[1] ?? 'm4a').replace('mpeg', 'mp3');
  const path = `chat/${matchId}/${session.user.id}-${randomSuffix()}.${extension}`;

  const file = new File(localUri);
  const buffer = await file.arrayBuffer();
  const body = new ExpoBlob([buffer], { type: mimeType });

  return uploadChatMedia(session, matchId, path, body, mimeType);
}

export function formatVoiceDuration(ms: number | null | undefined): string {
  if (!ms || ms <= 0) {
    return '0:00';
  }
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
