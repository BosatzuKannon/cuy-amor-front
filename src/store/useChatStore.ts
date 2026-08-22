import { create } from 'zustand';

import { getMatches, type ChatMatch } from '@/services/matches-service';
import { useAuthStore } from '@/store/useAuthStore';

type ChatState = {
  matches: ChatMatch[];
  hasUnreadNotifications: boolean;
  loading: boolean;
  fetchMatches: () => Promise<void>;
  clearMatches: () => void;
};

export const useChatStore = create<ChatState>((set) => ({
  matches: [],
  hasUnreadNotifications: false,
  loading: false,
  fetchMatches: async () => {
    const session = useAuthStore.getState().session;
    if (!session) {
      return;
    }
    set({ loading: true });
    try {
      const matches = await getMatches(session);
      set({
        matches,
        hasUnreadNotifications: matches.some(
          (match) => match.hasUnread || match.lastMessage === null,
        ),
      });
    } catch (error) {
      console.error('[useChatStore] fetchMatches failed:', error);
    } finally {
      set({ loading: false });
    }
  },
  clearMatches: () => {
    set({ matches: [], hasUnreadNotifications: false, loading: false });
  },
}));