import { DarkTheme, DefaultTheme, Stack, ThemeProvider, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import {
  AppState,
  StyleSheet,
  View,
  useColorScheme,
} from 'react-native';
import Toast from 'react-native-toast-message';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AppBackground } from '@/components/ui/app-background';
import { toastConfig } from '@/components/ui/app-toast';
import { initAuthListener } from '@/lib/auth-listener';
import { supabase } from '@/lib/supabase';
import { toast } from '@/lib/toast';
import { updateLastSeen } from '@/services/matches-service';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';
import { Colors } from '@/theme/colors';
import { useAppFonts } from '@/theme/use-app-fonts';

SplashScreen.preventAutoHideAsync();

type RealtimeMessagePayload = {
  id?: string;
  matchId?: string;
  senderId?: string;
  recipientId?: string | null;
  content?: string;
};

const MESSAGE_SNIPPET_MAX = 64;

function truncateSnippet(content: string): string {
  const normalized = content.replace(/\s+/g, ' ').trim();
  return normalized.length > MESSAGE_SNIPPET_MAX
    ? `${normalized.slice(0, MESSAGE_SNIPPET_MAX - 1)}…`
    : normalized;
}

function useGlobalMessageToasts() {
  const session = useAuthStore((state) => state.session);
  const supabaseToken = useAuthStore((state) => state.supabaseToken);
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

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
          if (
            activeChatMatchId &&
            decodeURIComponent(activeChatMatchId) === message.matchId
          ) {
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

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useAppFonts();
  const session = useAuthStore((state) => state.session);
  const isLoading = useAuthStore((state) => state.isLoading);
  const profileReady = useAuthStore((state) => state.profileReady);
  const profileComplete = useAuthStore((state) => state.profileComplete);

  useGlobalMessageToasts();
  useLastSeenTracker();

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
        </Stack>

        <AnimatedSplashOverlay />

        <Toast config={toastConfig} topOffset={56} visibilityTime={3400} />
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
});