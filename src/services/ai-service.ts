import type { Session } from '@supabase/supabase-js';

import { api } from '@/lib/api';

const AI_REQUEST_TIMEOUT_MS = 30000;

function authHeaders(session: Session) {
  return { Authorization: `Bearer ${session.access_token}` };
}

export type AiIcebreakerResult = {
  suggestions: string[];
  aiLeft: number;
};

export type AiProfileRoastResult = {
  score: number;
  headline: string;
  tips: string[];
  aiLeft: number;
};

export async function generateIcebreakers(
  session: Session,
  matchId: string,
): Promise<AiIcebreakerResult> {
  const { data } = await api.post<AiIcebreakerResult>(
    `/matches/${matchId}/ai/icebreaker`,
    {},
    { headers: authHeaders(session), timeout: AI_REQUEST_TIMEOUT_MS },
  );

  return data;
}

export async function generateProfileRoast(
  session: Session,
): Promise<AiProfileRoastResult> {
  const { data } = await api.post<AiProfileRoastResult>(
    '/users/me/ai/roast',
    {},
    { headers: authHeaders(session), timeout: AI_REQUEST_TIMEOUT_MS },
  );

  return data;
}

export function isAiQuotaExhausted(error: unknown): boolean {
  if (error && typeof error === 'object' && 'response' in error) {
    const code = (
      error as { response?: { data?: { error?: string } } }
    ).response?.data?.error;
    return code === 'AI_QUOTA_EXHAUSTED';
  }
  return false;
}

export function extractAiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const msg = (error as { response?: { data?: { message?: string } } })
      .response?.data?.message;
    if (typeof msg === 'string' && msg.length > 0) {
      return msg;
    }
  }
  return fallback;
}
