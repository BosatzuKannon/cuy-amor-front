import type { Session } from '@supabase/supabase-js';

import { api } from '@/lib/api';

export type StreakRewards = {
  coins: number;
  zumbidos: number;
  ninjaHours: number;
  leyendaHours: number;
  items: string[];
};

export type StreakClaimResponse = {
  claimed: boolean;
  currentStreak: number;
  longestStreak: number;
  loopDay: number;
  rewards: StreakRewards;
  coinsBalance: number;
  dailyZumbidosLeft: number;
  dailyCuyazosLeft: number;
  isNinja: boolean;
  isLeyenda: boolean;
};

export async function claimDailyStreak(
  session: Session,
): Promise<StreakClaimResponse> {
  const { data } = await api.post<StreakClaimResponse>(
    '/users/streak/claim',
    {},
    { headers: { Authorization: `Bearer ${session.access_token}` } },
  );
  return data;
}
