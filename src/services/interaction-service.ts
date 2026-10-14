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
};

export type InteractionHistoryEntry = {
  id: string;
  type: InteractionTypeCode;
  createdAt: string;
  target: ExploreProfile;
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
): Promise<InteractionHistoryEntry[]> {
  const { data } = await api.get<InteractionHistoryEntry[]>(
    '/users/interactions/history',
    { headers: authHeaders(session) },
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
