import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { useEffect } from 'react';
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

export function usePushNotifications() {
  const session = useAuthStore((state) => state.session);

  useEffect(() => {
    if (!session) {
      return;
    }

    let cancelled = false;

    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const url = response.notification.request.content.data?.url;

        if (typeof url !== 'string' || url.trim().length === 0) {
          return;
        }

        const path = Linking.parse(url.trim()).path ?? '';

        if (path.startsWith('/chat/')) {
          router.push(path as Href);
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

        if (cancelled || !token.data) {
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
      cancelled = true;
      responseSubscription.remove();
    };
  }, [session]);
}