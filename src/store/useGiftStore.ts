import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import {
  getGifts,
  type VirtualGiftSummary,
} from '@/services/matches-service';

type GiftState = {
  gifts: VirtualGiftSummary[] | null;
  isLoading: boolean;
  error: string | null;
  ensureGifts: (session: Session) => Promise<boolean>;
};

let inflight: Promise<boolean> | null = null;

export const useGiftStore = create<GiftState>()((set, get) => ({
  gifts: null,
  isLoading: false,
  error: null,
  ensureGifts: (session) => {
    if (get().gifts) {
      return Promise.resolve(true);
    }
    if (inflight) {
      return inflight;
    }
    set({ isLoading: true, error: null });
    inflight = getGifts(session)
      .then((data) => {
        set({ gifts: data });
        return true;
      })
      .catch((error) => {
        console.error('[gift-store] fetch failed:', error);
        set({ error: 'No se pudieron cargar los regalos' });
        return false;
      })
      .finally(() => {
        inflight = null;
        set({ isLoading: false });
      });
    return inflight;
  },
}));

export function selectGiftById(
  state: GiftState,
  giftId: string | null | undefined,
): VirtualGiftSummary | null {
  if (!giftId || !state.gifts) {
    return null;
  }
  return state.gifts.find((gift) => gift.id === giftId) ?? null;
}
