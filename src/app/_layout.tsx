import { DarkTheme, DefaultTheme, Stack, ThemeProvider, usePathname } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  AppState,
  StyleSheet,
  Vibration,
  View,
  useColorScheme,
} from 'react-native';
import Toast from 'react-native-toast-message';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { HardUpdateModal } from '@/components/hard-update-modal';
import { SoftUpdateBanner } from '@/components/soft-update-banner';
import { AppBackground } from '@/components/ui/app-background';
import { toastConfig } from '@/components/ui/app-toast';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useUpdateGate } from '@/hooks/useUpdateGate';
import { initAuthListener } from '@/lib/auth-listener';
import { useInteractionSounds } from '@/lib/interaction-sounds';
import { supabase } from '@/lib/supabase';
import { toast } from '@/lib/toast';
import { updateLastSeen, type VirtualGiftSummary } from '@/services/matches-service';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';
import { selectGiftById, useGiftStore } from '@/store/useGiftStore';
import { Colors } from '@/theme/colors';
import { useAppFonts } from '@/theme/use-app-fonts';

SplashScreen.preventAutoHideAsync();

type RealtimeMessagePayload = {
  id?: string;
  matchId?: string;
  senderId?: string;
  recipientId?: string | null;
  content?: string;
  isSystemMessage?: boolean;
  giftId?: string | null;
};

const MESSAGE_SNIPPET_MAX = 64;
const ZUMBIDO_DURATION_MS = 5000;
const GIFT_RECEIVER_SHARE = 0.35;
const ZUMBIDO_VIBRATION_PATTERN = [
  0,
  1000,
  200,
  1000,
  200,
  1000,
  200,
  1000,
  200,
  1000,
] as const;

function truncateSnippet(content: string): string {
  const normalized = content.replace(/\s+/g, ' ').trim();
  return normalized.length > MESSAGE_SNIPPET_MAX
    ? `${normalized.slice(0, MESSAGE_SNIPPET_MAX - 1)}…`
    : normalized;
}

function useZumbidoShake() {
  const [shakeAnimation] = useState(() => new Animated.Value(0));
  const shakeLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const shakeStopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const stopZumbidoFeedback = useCallback(() => {
    if (shakeStopTimeoutRef.current) {
      clearTimeout(shakeStopTimeoutRef.current);
      shakeStopTimeoutRef.current = null;
    }
    if (shakeLoopRef.current) {
      shakeLoopRef.current.stop();
      shakeLoopRef.current = null;
    }
    shakeAnimation.setValue(0);
    Vibration.cancel();
  }, [shakeAnimation]);

  const triggerZumbido = useCallback(() => {
    stopZumbidoFeedback();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnimation, {
          toValue: 12,
          duration: 55,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: -12,
          duration: 55,
          useNativeDriver: true,
        }),
      ]),
    );
    shakeLoopRef.current = loop;
    loop.start();
    shakeStopTimeoutRef.current = setTimeout(() => {
      shakeStopTimeoutRef.current = null;
      if (shakeLoopRef.current) {
        shakeLoopRef.current.stop();
        shakeLoopRef.current = null;
      }
      shakeAnimation.setValue(0);
      Vibration.cancel();
    }, ZUMBIDO_DURATION_MS);
    Vibration.vibrate([...ZUMBIDO_VIBRATION_PATTERN]);
  }, [shakeAnimation, stopZumbidoFeedback]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        stopZumbidoFeedback();
      }
    });
    return () => {
      subscription.remove();
      stopZumbidoFeedback();
    };
  }, [stopZumbidoFeedback]);

  return { shakeAnimation, triggerZumbido };
}

function creditReceiverForGift(gift: VirtualGiftSummary) {
  const receiverCut = Math.floor(gift.cashValueInCents * GIFT_RECEIVER_SHARE);
  const currentCash =
    useAuthStore.getState().profile?.cashBalanceInCents ?? 0;
  useAuthStore.getState().setCashBalance(currentCash + receiverCut);
}

function useGlobalMessageToasts({
  onZumbidoReceived,
}: {
  onZumbidoReceived: () => void;
}) {
  const session = useAuthStore((state) => state.session);
  const supabaseToken = useAuthStore((state) => state.supabaseToken);
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const onZumbidoRef = useRef(onZumbidoReceived);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    onZumbidoRef.current = onZumbidoReceived;
  }, [onZumbidoReceived]);

  useEffect(() => {
    if (!session || !supabaseToken) {
      return;
    }
    supabase.realtime.setAuth(supabaseToken);

    const channel = supabase
      .channel('global-message-toasts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'Message' },
        (payload) => {
          const message = payload.new as unknown as RealtimeMessagePayload;
          if (!message?.id || message.senderId === session.user.id) {
            return;
          }
          if (message.recipientId && message.recipientId !== session.user.id) {
            return;
          }
          const activeChatMatchId = /^\/chat\/([^/?]+)/.exec(
            pathnameRef.current ?? '',
          )?.[1];
          const isActiveChat =
            Boolean(activeChatMatchId) &&
            decodeURIComponent(activeChatMatchId as string) === message.matchId;
          if (message.isSystemMessage === true) {
            const isGift = Boolean(message.giftId);
            if (isGift) {
              const foundGift = selectGiftById(
                useGiftStore.getState(),
                message.giftId,
              );
              if (foundGift) {
                creditReceiverForGift(foundGift);
              } else {
                void useGiftStore
                  .getState()
                  .ensureGifts(session)
                  .then((loaded) => {
                    if (!loaded) {
                      return;
                    }
                    const retryGift = selectGiftById(
                      useGiftStore.getState(),
                      message.giftId,
                    );
                    if (retryGift) {
                      creditReceiverForGift(retryGift);
                    }
                  })
                  .catch(() => {});
              }
              if (!isActiveChat) {
                const giftSenderName = useChatStore
                  .getState()
                  .matches.find((match) => match.id === message.matchId)
                  ?.otherUser.firstName;
                toast.newMessage(
                  giftSenderName
                    ? `¡${giftSenderName} te ha enviado un regalo!`
                    : '¡Te ha enviado un regalo!',
                );
              }
              return;
            }
            onZumbidoRef.current();
            if (!isActiveChat) {
              const buzzSenderName = useChatStore
                .getState()
                .matches.find((match) => match.id === message.matchId)
                ?.otherUser.firstName;
              toast.newMessage(
                buzzSenderName
                  ? `¡${buzzSenderName} te ha enviado un zumbido!`
                  : '¡Te ha enviado un zumbido!',
              );
            }
            return;
          }
          if (isActiveChat) {
            return;
          }
          const senderMatch = useChatStore
            .getState()
            .matches.find((match) => match.id === message.matchId);
          const senderName = senderMatch?.otherUser.firstName;
          toast.newMessage(
            senderName ? `Nuevo mensaje de ${senderName}` : 'Nuevo mensaje',
            message.content ? truncateSnippet(message.content) : undefined,
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, supabaseToken]);
}

function useLastSeenTracker() {
  const session = useAuthStore((state) => state.session);

  useEffect(() => {
    if (!session) {
      return;
    }
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        void updateLastSeen(session).catch(() => {});
      }
    });
    return () => {
      subscription.remove();
    };
  }, [session]);
}

function GatedApp({
  softUpdateUrl,
  onDismissSoftUpdate,
  softUpdatePending,
}: {
  softUpdateUrl: string;
  onDismissSoftUpdate: () => void;
  softUpdatePending: boolean;
}) {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useAppFonts();
  const session = useAuthStore((state) => state.session);
  const isLoading = useAuthStore((state) => state.isLoading);
  const profileReady = useAuthStore((state) => state.profileReady);
  const profileComplete = useAuthStore((state) => state.profileComplete);

  const { shakeAnimation, triggerZumbido } = useZumbidoShake();
  const { playZumbido } = useInteractionSounds();

  useGlobalMessageToasts({
    onZumbidoReceived: useCallback(() => {
      playZumbido();
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      triggerZumbido();
    }, [playZumbido, triggerZumbido]),
  });
  useLastSeenTracker();

  usePushNotifications();

  useEffect(() => {
    initAuthListener();
  }, []);

  const isAuthenticated = session !== null;
  const ready =
    (fontsLoaded || fontError) && !isLoading && (!isAuthenticated || profileReady);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  const baseTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      background: 'transparent',
      card: 'transparent',
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <View style={styles.root}>
        <AppBackground />

        <Animated.View
          style={[
            styles.shakeRoot,
            { transform: [{ translateX: shakeAnimation }] },
          ]}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
          <Stack.Protected guard={isAuthenticated && profileComplete}>
            <Stack.Screen name="(tabs)" />
          </Stack.Protected>

          <Stack.Protected guard={isAuthenticated && !profileComplete}>
            <Stack.Screen name="onboarding" />
          </Stack.Protected>

          <Stack.Protected guard={!isAuthenticated}>
            <Stack.Screen name="index" />
          </Stack.Protected>

          <Stack.Screen
            name="invite"
            options={{
              presentation: 'transparentModal',
              animation: 'none',
            }}
          />

          <Stack.Screen
            name="terms"
            options={{
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="privacy"
            options={{
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="edit-profile"
            options={{
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="search-preferences"
            options={{
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="chat/[id]"
            options={{
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="referrals"
            options={{
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="wallet/payout"
            options={{
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="wallet/wallet-history"
            options={{
              presentation: 'card',
            }}
          />
        </Stack>
        </Animated.View>

        {softUpdatePending && (
          <SoftUpdateBanner
            updateUrl={softUpdateUrl}
            onDismiss={onDismissSoftUpdate}
          />
        )}

        <AnimatedSplashOverlay />

        <Toast config={toastConfig} topOffset={56} visibilityTime={3400} />
      </View>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const {
    ready: gateReady,
    status,
    config,
    softUpdatePending,
    dismissSoftUpdate,
  } = useUpdateGate();

  const updateUrl =
    config?.updateUrl || 'market://details?id=com.bosatzu.frontcuyamor';

  if (!gateReady) {
    return <View style={styles.root} />;
  }

  if (status === 'hardBlocked') {
    return (
      <View style={styles.root}>
        <HardUpdateModal />
      </View>
    );
  }

  return (
    <GatedApp
      softUpdateUrl={updateUrl}
      softUpdatePending={softUpdatePending}
      onDismissSoftUpdate={dismissSoftUpdate}
    />
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  shakeRoot: {
    flex: 1,
  },
});
