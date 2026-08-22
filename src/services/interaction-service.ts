import type { Session } from '@supabase/supabase-js';

import { api } from '@/lib/api';

export type InteractionTypeCode = 'LIKE' | 'PASS' | 'SUPER_LIKE';

export type CreateInteractionResult = {
  success: boolean;
  isMatch: boolean;
  matchId?: string;
  newCoinBalance?: number;
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
