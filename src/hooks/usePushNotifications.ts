import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import {
  useRootNavigationState,
  useRouter,
  type Href,
} from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

function getAuthHeaders() {
  const token = useAuthStore.getState().session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function registerDeviceWithBackend(pushToken: string) {
  const headers = getAuthHeaders();
  if (!headers.Authorization) {
    return;
  }
  await api.post(
    '/users/me/devices',
    { pushToken, platform: Platform.OS },
    { headers },
  );
}

function extractRoutePath(url: unknown): string {
  if (typeof url !== 'string' || url.trim().length === 0) {
    return '';
  }

  const value = url.trim();

  let path = value.replace(/^cuyamor:\/\//i, '/');
  path = path.replace(/^\/+/, '/');

  return path;
}

export function usePushNotifications() {
  const session = useAuthStore((state) => state.session);
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const hasNavigatedColdStart = useRef(false);

  useEffect(() => {
    if (!session) {
      return;
    }

    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const normalizedPath = extractRoutePath(
          response.notification.request.content.data?.url,
        );

        if (normalizedPath.length > 0) {
          router.push(normalizedPath as Href);
        }
      });

    async function register() {
      try {
        if (!Device.isDevice) {
          return;
        }

        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();
        const { status: finalStatus } =
          existingStatus === 'granted'
            ? { status: existingStatus }
            : await Notifications.requestPermissionsAsync();

        if (finalStatus !== 'granted') {
          return;
        }

        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        const token = await Notifications.getExpoPushTokenAsync({ projectId });

        if (!token.data) {
          return;
        }

        await registerDeviceWithBackend(token.data);
        console.log('[usePushNotifications] device token registered');
      } catch (error) {
        console.warn(
          '[usePushNotifications] token registration failed:',
          error,
        );
      }
    }

    void register();

    return () => {
      responseSubscription.remove();
    };
  }, [session, router]);

  useEffect(() => {
    if (!rootNavigationState?.key) {
      return;
    }
    if (hasNavigatedColdStart.current) {
      return;
    }
    hasNavigatedColdStart.current = true;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    timeoutId = setTimeout(() => {
      void (async () => {
        try {
          const lastResponse =
            await Notifications.getLastNotificationResponseAsync();
          if (!lastResponse || cancelled) {
            return;
          }

          const normalizedPath = extractRoutePath(
            lastResponse.notification.request.content.data?.url,
          );

          if (normalizedPath.length > 0) {
            router.push(normalizedPath as Href);
          }
        } catch (error) {
          console.warn(
            '[usePushNotifications] cold start routing failed:',
            error,
          );
        }
      })();
    }, 500);

    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [rootNavigationState?.key, router]);
}
