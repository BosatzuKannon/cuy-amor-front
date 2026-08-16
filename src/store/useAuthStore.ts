import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';

export type GenderCode = 'MALE' | 'FEMALE' | 'OTHER';
export type InterestedInCode = 'WOMEN' | 'MEN' | 'BOTH';
export type RelationshipGoalCode =
  | 'CASUAL'
  | 'FRIENDSHIP'
  | 'RELATIONSHIP'
  | 'CHAT';

export type UserProfile = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  birthDate: string | null;
  gender: GenderCode | null;
  interestedIn: InterestedInCode | null;
  relationshipGoal: RelationshipGoalCode | null;
  hobbies: string[];
  bio: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  photoCount: number;
};

type AuthState = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  profile: UserProfile | null;
  profileComplete: boolean;
  profileReady: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (isLoading: boolean) => void;
  setProfile: (profile: UserProfile | null) => void;
  markProfileComplete: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  profile: null,
  profileComplete: false,
  profileReady: false,
  setUser: (user) => {
    console.log('[useAuthStore] setUser:', user?.id ?? null);
    set({ user });
  },
  setSession: (session) => {
    console.log('[useAuthStore] setSession:', session ? `yes (${session.user?.id})` : 'no');
    set({ session });
  },
  setLoading: (isLoading) => {
    console.log('[useAuthStore] setLoading:', isLoading);
    set({ isLoading });
  },
setProfile: (profile) => {
      const profileComplete =
        !!profile &&
        !!profile.birthDate &&
        !!profile.gender &&
        profile.photoCount > 0;
      console.log(
        '[useAuthStore] setProfile:',
        profileComplete ? 'complete' : 'incomplete',
        profile
          ? `${profile.firstName ?? profile.id} (${profile.photoCount} photo(s))`
          : 'null',
      );
      set({ profile, profileComplete, profileReady: true });
    },
    markProfileComplete: () => {
      console.log('[useAuthStore] markProfileComplete');
      set({ profileComplete: true, profileReady: true });
    },
  }));