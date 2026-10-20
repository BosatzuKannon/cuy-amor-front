import type { Session } from '@supabase/supabase-js';

import { api } from '@/lib/api';
import type { ExploreProfile } from '@/services/profile-service';

export type InteractionTypeCode = 'LIKE' | 'PASS' | 'SUPER_LIKE';

export type CreateInteractionResult = {
  success: boolean;
  isMatch: boolean;
  matchId?: string;
  newCoinBalance?: number;
};

export type ChangeInteractionResult = {
  success: boolean;
  previousType: InteractionTypeCode;
  type: InteractionTypeCode;
  isMatch: boolean;
  matchId?: string;
  newCoinBalance?: number;
};

export type InteractionHistoryEntry = {
  id: string;
  type: InteractionTypeCode;
  createdAt: string;
  target: ExploreProfile;
};

export type InteractionHistoryPage = {
  data: InteractionHistoryEntry[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type InteractionHistoryParams = {
  cursor?: string;
  limit?: number;
};

export type WhoLikesMeEntry = {
  id: string;
  type: Extract<InteractionTypeCode, 'LIKE' | 'SUPER_LIKE'>;
  createdAt: string;
  liker: ExploreProfile;
};

export type WhoLikesMePage = {
  data: WhoLikesMeEntry[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
};

export type WhoLikesMeParams = {
  cursor?: string;
  limit?: number;
};

function authHeaders(session: Session) {
  return { Authorization: `Bearer ${session.access_token}` };
}

export async function createInteraction(
  toUserId: string,
  type: InteractionTypeCode,
  session: Session,
): Promise<CreateInteractionResult> {
  const { data } = await api.post<CreateInteractionResult>(
    '/interactions',
    { toUserId, type },
    { headers: authHeaders(session) },
  );

  return data;
}

export async function getInteractionHistory(
  session: Session,
  params: InteractionHistoryParams = {},
): Promise<InteractionHistoryPage> {
  const { data } = await api.get<InteractionHistoryPage>(
    '/users/interactions/history',
    {
      headers: authHeaders(session),
      params: {
        ...(params.cursor ? { cursor: params.cursor } : {}),
        ...(params.limit ? { limit: params.limit } : {}),
      },
    },
  );

  return data;
}

export async function getWhoLikesMe(
  session: Session,
  params: WhoLikesMeParams = {},
): Promise<WhoLikesMePage> {
  const { data } = await api.get<WhoLikesMePage>(
    '/users/interactions/who-likes-me',
    {
      headers: authHeaders(session),
      params: {
        ...(params.cursor ? { cursor: params.cursor } : {}),
        ...(params.limit ? { limit: params.limit } : {}),
      },
    },
  );

  return data;
}

export async function changeInteraction(
  targetUserId: string,
  newActionType: Extract<InteractionTypeCode, 'LIKE' | 'SUPER_LIKE'>,
  session: Session,
): Promise<ChangeInteractionResult> {
  const { data } = await api.put<ChangeInteractionResult>(
    '/users/interactions/change',
    { targetUserId, newActionType },
    { headers: authHeaders(session) },
  );

  return data;
}
