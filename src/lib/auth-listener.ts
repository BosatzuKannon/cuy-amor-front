import type { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';

import { api } from '@/lib/api';
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
  const fullName =
    typeof metadata.full_name === 'string' ? metadata.full_name.trim() : '';
  const name = typeof metadata.name === 'string' ? metadata.name.trim() : '';
  const derivedName = fullName || name;
  const [firstName = '', ...rest] = derivedName.split(' ');

  const googleIdentity = session.user.identities?.find(
    (identity) => identity.provider === 'google',
  );

  const payload = {
    email: session.user.email,
    googleId:
      (metadata.provider_id as string | undefined) ?? googleIdentity?.id,
    firstName: firstName || undefined,
    lastName: rest.length ? rest.join(' ') : undefined,
  };

  try {
    const response = await api.post('/auth/sync', payload, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });
    console.log('[auth-listener] sync success. Backend response:', JSON.stringify(response.data).slice(0, 300));
  } catch (error) {
    console.log('[auth-listener] sync error:', error);
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
      void handleAuthUrl(url);
    }
  });

  Linking.addEventListener('url', ({ url }) => {
    console.log('[auth-listener] deep link received:', url);
    void handleAuthUrl(url);
  });

  supabase.auth.getSession().then(({ data: { session } }) => {
    console.log('[auth-listener] getSession resolved:', session ? `session present (${session.user.id})` : 'no session');
    const store = useAuthStore.getState();
    store.setSession(session);
    store.setUser(session?.user ?? null);

    if (session) {
      void syncUserWithBackend(session);
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
      void syncUserWithBackend(session);
      void loadUserProfile(session);
    }
  });

  return () => {
    listenerStarted = false;
  };
}