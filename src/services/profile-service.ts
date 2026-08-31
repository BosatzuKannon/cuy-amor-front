import type { ImagePickerAsset } from 'expo-image-picker';
import type { Session } from '@supabase/supabase-js';

import { api } from '@/lib/api';
import { removeImageFromBucket, uploadImageToBucket } from '@/lib/photo-upload';

const MAX_PHOTOS = 3;

export type GenderCode = 'MALE' | 'FEMALE' | 'OTHER';
export type InterestedInCode = 'WOMEN' | 'MEN' | 'BOTH';
export type RelationshipGoalCode =
  | 'CASUAL'
  | 'FRIENDSHIP'
  | 'RELATIONSHIP'
  | 'CHAT'
  | 'LET_IT_FLOW'
  | 'LIGHT_CASUAL';

export type ProfilePreferences = {
  pushNotifications: boolean;
  emailNotifications: boolean;
  matchAlerts: boolean;
  messageAlerts: boolean;
  showLocation: boolean;
  invisibleMode: boolean;
  maxDistanceKm: number;
  minAgePreference: number;
  maxAgePreference: number;
};

export type ProfilePhoto = {
  id?: string;
  url: string;
  order: number;
  isProfile: boolean;
};

export type UserProfileData = {
  firstName: string;
  lastName: string | null;
  gender: GenderCode | null;
  birthDate: string | null;
  bio: string | null;
  city: string | null;
  interestedIn: InterestedInCode | null;
  relationshipGoal: RelationshipGoalCode | null;
  hobbies: string[];
  latitude: number | null;
  longitude: number | null;
  preferences: ProfilePreferences | null;
  photos: ProfilePhoto[];
  coinsBalance?: number;
  cashBalanceInCents?: number;
  referralCode?: string;
  referralEarningsInCents?: number;
  isNinja?: boolean;
  isLeyenda?: boolean;
  leyendaExpiresAt?: string | null;
  leyendaDaysLeft?: number;
  dailyZumbidosLeft?: number;
  dailyCuyazosLeft?: number;
  ninjaDaysLeft?: number;
};

export type UpdateProfileData = {
  firstName?: string;
  lastName?: string | null;
  gender?: GenderCode;
  birthDate?: string;
  bio?: string;
  city?: string;
  interestedIn?: InterestedInCode;
  relationshipGoal?: RelationshipGoalCode;
  hobbies?: string[];
  preferences?: Partial<ProfilePreferences>;
};

export type UpdatePreferencesData = {
  minAgePreference?: number;
  maxAgePreference?: number;
  maxDistanceKm?: number;
  showLocation?: boolean;
  invisibleMode?: boolean;
};

export type ExploreProfile = {
  id: string;
  firstName: string;
  birthDate: string | null;
  bio: string | null;
  gender: GenderCode | null;
  city?: string | null;
  relationshipGoal?: RelationshipGoalCode | null;
  hobbies?: string[];
  distance?: number | null;
  isLeyenda?: boolean;
  photo: { id: string; url: string } | null;
  photos?: { id: string; url: string }[];
};

export type PhotoDraft =
  | { kind: 'existing'; id: string; url: string }
  | { kind: 'new'; asset: ImagePickerAsset };

function authHeaders(session: Session) {
  return { Authorization: `Bearer ${session.access_token}` };
}

function normalizeProfile(raw: UserProfileData): UserProfileData {
  return {
    ...raw,
    birthDate: raw.birthDate ? raw.birthDate.slice(0, 10) : null,
    photos: (raw.photos ?? [])
      .slice(0, MAX_PHOTOS)
      .sort((a, b) => a.order - b.order),
  };
}

export async function getUserProfile(
  userId: string,
  session: Session,
): Promise<UserProfileData> {
  const { data } = await api.get<UserProfileData>('/users/me', {
    headers: authHeaders(session),
  });

  return normalizeProfile(data);
}

export async function getExploreFeed(
  session: Session,
): Promise<ExploreProfile[]> {
  const { data } = await api.get<ExploreProfile[]>('/explore', {
    headers: authHeaders(session),
  });

  return data;
}

export async function updateUserProfile(
  userId: string,
  updateData: UpdateProfileData,
  photos: PhotoDraft[] = [],
  session: Session,
): Promise<UserProfileData> {
  const current = await getUserProfile(userId, session);

  if (photos.length > MAX_PHOTOS) {
    throw new Error(`No puedes tener más de ${MAX_PHOTOS} fotos en tu perfil.`);
  }

  const newDrafts = photos.filter(
    (photo): photo is Extract<PhotoDraft, { kind: 'new' }> =>
      photo.kind === 'new',
  );

  const uploadedUrls: string[] = [];
  for (const draft of newDrafts) {
    const url = await uploadImageToBucket(session, draft.asset);
    uploadedUrls.push(url);
  }

  let uploadedIndex = 0;
  const finalPhotos: ProfilePhoto[] = photos.map((draft, index) => {
    if (draft.kind === 'existing') {
      return {
        id: draft.id,
        url: draft.url,
        order: index,
        isProfile: index === 0,
      };
    }
    const url = uploadedUrls[uploadedIndex++];
    return { url, order: index, isProfile: index === 0 };
  });

  const removedPhotoUrls = current.photos
    .filter(
      (photo) =>
        !photos.some(
          (draft) => draft.kind === 'existing' && draft.url === photo.url,
        ),
    )
    .map((photo) => photo.url);

  if (removedPhotoUrls.length > 0) {
    await Promise.all(
      removedPhotoUrls.map((url) =>
        removeImageFromBucket(url).catch(() => undefined),
      ),
    );
  }

  const payload = {
    ...updateData,
    photos: finalPhotos,
  };

  const { data } = await api.patch<UserProfileData>('/users/edit', payload, {
    headers: authHeaders(session),
  });

  return normalizeProfile(data);
}

export async function deleteAccount(session: Session): Promise<void> {
  await api.delete('/users/me', {
    headers: authHeaders(session),
  });
}

export async function updateUserPreferences(
  userId: string,
  updateData: UpdatePreferencesData,
  session: Session,
): Promise<ProfilePreferences> {
  const { data } = await api.patch<UserPreferenceRow>(
    '/users/preferences',
    updateData,
    { headers: authHeaders(session) },
  );

  return {
    pushNotifications: data.pushNotifications,
    emailNotifications: data.emailNotifications,
    matchAlerts: data.matchAlerts,
    messageAlerts: data.messageAlerts,
    showLocation: data.showLocation,
    invisibleMode: data.invisibleMode,
    maxDistanceKm: data.maxDistanceKm,
    minAgePreference: data.minAgePreference,
    maxAgePreference: data.maxAgePreference,
  };
}

type UserPreferenceRow = {
  pushNotifications: boolean;
  emailNotifications: boolean;
  matchAlerts: boolean;
  messageAlerts: boolean;
  showLocation: boolean;
  invisibleMode: boolean;
  maxDistanceKm: number;
  minAgePreference: number;
  maxAgePreference: number;
};