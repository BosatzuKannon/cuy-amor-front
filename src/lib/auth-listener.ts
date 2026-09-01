import type { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';

import { api } from '@/lib/api';
import {
  captureReferralCode,
  getPendingReferralCode,
  consumePendingReferralCode,
} from '@/lib/referral-capture';
import { supabase } from '@/lib/supabase';
import { getUserProfile } from '@/services/profile-service';
import { useChatStore } from '@/store/useChatStore';
import { toUserProfile, useAuthStore } from '@/store/useAuthStore';

let lastProcessedCode = '';

function extractAuthParams(url: string) {
  const code = url.match(/[?&#]code=([^&#]+)/)?.[1];
  const flowId = url.match(/[?&#]sb_flow_id=([^&#]+)/)?.[1];
  return {
    code: code ? decodeURIComponent(code) : null,
    flowId: flowId ? decodeURIComponent(flowId) : null,
  };
}

export async function handleAuthUrl(url: string) {
  console.log('[auth-listener] handleAuthUrl:', url);

  if (!url) {
    return;
  }

  const { code, flowId } = extractAuthParams(url);

  if (!code) {
    console.log('[auth-listener] No auth code in URL; ignoring');
    return;
  }

  if (code === lastProcessedCode) {
    console.log('[auth-listener] Auth code already processed; skipping duplicate');
    return;
  }
  lastProcessedCode = code;

  console.log('[auth-listener] Exchanging auth code for session (flowId:', flowId, ')');
  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(
      code,
      flowId ? { flowId } : undefined,
    );

    if (error) {
      console.log('[auth-listener] exchangeCodeForSession error:', error);
      return;
    }

    console.log(
      '[auth-listener] Session established via code exchange, user id:',
      data.session?.user?.id ?? data.user?.id ?? 'unknown',
    );
    console.log('[auth-listener] session.access_token:', data.session?.access_token ?? 'none');
  } catch (err) {
    console.log('[auth-listener] Unexpected error during code exchange:', err);
  }
}

async function syncUserWithBackend(session: Session) {
  console.log('[auth-listener] syncing user with backend, user id:', session.user.id);

  const metadata = session.user.user_metadata ?? {};

  const googleIdentity = session.user.identities?.find(
    (identity) => identity.provider === 'google',
  );
  const identityData = googleIdentity?.identity_data ?? {};

  const fullName =
    typeof metadata.full_name === 'string'
      ? metadata.full_name.trim()
      : typeof identityData.full_name === 'string'
        ? identityData.full_name.trim()
        : '';
  const name =
    typeof metadata.name === 'string'
      ? metadata.name.trim()
      : typeof identityData.name === 'string'
        ? identityData.name.trim()
        : '';
  const derivedName = fullName || name;

  const givenName =
    typeof metadata.given_name === 'string'
      ? metadata.given_name.trim()
      : typeof identityData.given_name === 'string'
        ? identityData.given_name.trim()
        : '';
  const familyName =
    typeof metadata.family_name === 'string'
      ? metadata.family_name.trim()
      : typeof identityData.family_name === 'string'
        ? identityData.family_name.trim()
        : '';

  const [firstNameFromFull = '', ...restFromFull] = derivedName.split(' ');
  const firstName = givenName || firstNameFromFull;
  const lastName = familyName || (restFromFull.length ? restFromFull.join(' ') : '');

  const referralCode = getPendingReferralCode();

  const payload = {
    email: session.user.email,
    googleId:
      (metadata.provider_id as string | undefined) ??
      googleIdentity?.id ??
      null,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    ...(referralCode ? { referredBy: referralCode } : {}),
  };

  try {
    const response = await api.post('/auth/sync', payload, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });
    if (referralCode) {
      consumePendingReferralCode();
    }
    console.log('[auth-listener] sync success. Backend response:', JSON.stringify(response.data).slice(0, 300));
  } catch (error) {
    console.log('[auth-listener] sync error:', error);
    throw error;
  }
}

export async function loadUserProfile(session: Session) {
  try {
    const data = await getUserProfile(session.user.id, session);
    const current = useAuthStore.getState().profile;

    useAuthStore.getState().setProfile(
      toUserProfile(data, {
        id: session.user.id,
        email: session.user.email ?? null,
        coinsBalance: data.coinsBalance ?? current?.coinsBalance,
        cashBalanceInCents:
          data.cashBalanceInCents ?? current?.cashBalanceInCents,
      }),
    );
    console.log('[auth-listener] profile loaded for user:', session.user.id);
    void useChatStore.getState().fetchMatches();
    void useAuthStore.getState().fetchSupabaseToken();
  } catch (error) {
    console.log('[auth-listener] failed to load profile:', error);
    useAuthStore.getState().setProfile(null);
  }
}

let syncPromise: Promise<void> | null = null;

export function ensureUserSynced(session: Session): Promise<void> {
  if (!syncPromise) {
    syncPromise = syncUserWithBackend(session).finally(() => {
      syncPromise = null;
    });
  }
  return syncPromise;
}

let listenerStarted = false;

export function initAuthListener() {
  if (listenerStarted) {
    return;
  }
  listenerStarted = true;

  console.log('[auth-listener] initialize');

  Linking.getInitialURL().then((url) => {
    console.log('[auth-listener] getInitialURL:', url);
    if (url) {
      const captured = captureReferralCode(url);
      if (captured) {
        console.log('[auth-listener] referral captured from initial URL:', captured);
      }
      void handleAuthUrl(url);
    }
  });

  Linking.addEventListener('url', ({ url }) => {
    console.log('[auth-listener] deep link received:', url);
    const captured = captureReferralCode(url);
    if (captured) {
      console.log('[auth-listener] referral captured from deep link:', captured);
    }
    void handleAuthUrl(url);
  });

  supabase.auth.getSession().then(({ data: { session } }) => {
    console.log('[auth-listener] getSession resolved:', session ? `session present (${session.user.id})` : 'no session');
    const store = useAuthStore.getState();
    store.setSession(session);
    store.setUser(session?.user ?? null);

    if (session) {
      void ensureUserSynced(session).catch(() => {
        console.log('[auth-listener] sync failed for user:', session.user.id);
      });
      void loadUserProfile(session);
    }

    store.setLoading(false);
  });

  supabase.auth.onAuthStateChange((event, session) => {
    console.log('[auth-listener] onAuthStateChange event:', event, '| session:', session ? 'present' : 'none');

    const store = useAuthStore.getState();
    store.setSession(session);
    store.setUser(session?.user ?? null);
    store.setLoading(false);

    if (session) {
      void ensureUserSynced(session).catch(() => {
        console.log('[auth-listener] sync failed for user:', session.user.id);
      });
      void loadUserProfile(session);
    }
  });

  return () => {
    listenerStarted = false;
  };
}