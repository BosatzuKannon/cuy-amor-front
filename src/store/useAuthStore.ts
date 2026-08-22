import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';

import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { titleCase } from '@/lib/text';
import type { ProfilePreferences, UserProfileData } from '@/services/profile-service';

export type GenderCode = 'MALE' | 'FEMALE' | 'OTHER';
export type InterestedInCode = 'WOMEN' | 'MEN' | 'BOTH';
export type RelationshipGoalCode =
  | 'CASUAL'
  | 'FRIENDSHIP'
  | 'RELATIONSHIP'
  | 'CHAT';

export type ProfilePhoto = {
  id: string;
  url: string;
  order: number;
  isProfile: boolean;
};

export type UserProfile = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  birthDate: string | null;
  gender: GenderCode | null;
  interestedIn: InterestedInCode | null;
  relationshipGoal: RelationshipGoalCode | null;
  hobbies: string[];
  bio: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  preferences: ProfilePreferences | null;
  photos: ProfilePhoto[];
  coinsBalance: number;
};

export const DEFAULT_COINS_BALANCE = 150;

export function toUserProfile(
  data: UserProfileData,
  options: { id: string; email: string | null; coinsBalance?: number },
): UserProfile {
  return {
    id: options.id,
    email: options.email,
    firstName: data.firstName,
    lastName: data.lastName,
    fullName:
      titleCase([data.firstName, data.lastName].filter(Boolean).join(' ')) ||
      null,
    birthDate: data.birthDate,
    gender: data.gender,
    interestedIn: data.interestedIn,
    relationshipGoal: data.relationshipGoal,
    hobbies: Array.isArray(data.hobbies) ? data.hobbies : [],
    bio: data.bio,
    city: data.city,
    latitude: data.latitude,
    longitude: data.longitude,
    preferences: data.preferences,
    photos: (data.photos ?? []).map((photo) => ({
      id: photo.id ?? '',
      url: photo.url,
      order: photo.order,
      isProfile: photo.isProfile,
    })),
    coinsBalance: options.coinsBalance ?? DEFAULT_COINS_BALANCE,
  };
}

type AuthState = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  profile: UserProfile | null;
  profileComplete: boolean;
  profileReady: boolean;
  supabaseToken: string | null;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (isLoading: boolean) => void;
  setProfile: (profile: UserProfile | null) => void;
  fetchSupabaseToken: () => Promise<void>;
  deductCoins: (amount: number) => boolean;
  setCoinsBalance: (coinsBalance: number) => void;
  markProfileComplete: () => void;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  profile: null,
  profileComplete: false,
  profileReady: false,
  supabaseToken: null,
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
        (profile.photos?.length ?? 0) > 0;
      console.log(
        '[useAuthStore] setProfile:',
        profileComplete ? 'complete' : 'incomplete',
        profile
          ? `${profile.firstName ?? profile.id} (${profile.photos?.length ?? 0} photo(s))`
          : 'null',
      );
      set({ profile, profileComplete, profileReady: true });
    },
    deductCoins: (amount) => {
      const { profile } = get();
      if (!profile || profile.coinsBalance < amount) {
        return false;
      }
      set({
        profile: {
          ...profile,
          coinsBalance: profile.coinsBalance - amount,
        },
      });
      return true;
    },
    setCoinsBalance: (coinsBalance) => {
      set((state) => {
        if (!state.profile) {
          return {};
        }
        return { profile: { ...state.profile, coinsBalance } };
      });
    },
    fetchSupabaseToken: async () => {
      const { session } = get();
      if (!session) {
        return;
      }
      try {
        const { data } = await api.get<{ supabaseToken: string }>(
          '/auth/supabase-token',
          { headers: { Authorization: `Bearer ${session.access_token}` } },
        );
        set({ supabaseToken: data.supabaseToken });
      } catch (error) {
        console.error('[useAuthStore] fetchSupabaseToken failed:', error);
      }
    },
    markProfileComplete: () => {
      console.log('[useAuthStore] markProfileComplete');
      set({ profileComplete: true, profileReady: true });
    },
    logout: async () => {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error('[useAuthStore] signOut error:', error);
      }
      set({
        user: null,
        session: null,
        profile: null,
        profileComplete: false,
        profileReady: false,
        supabaseToken: null,
      });
    },
  }));