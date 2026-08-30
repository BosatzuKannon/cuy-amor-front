import { useRootNavigationState, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors } from '@/theme/colors';

export default function InviteBridgeScreen() {
  const router = useRouter();
  const navigationReady = useRootNavigationState()?.key != null;

  useEffect(() => {
    if (navigationReady) {
      router.replace('/');
    }
  }, [navigationReady, router]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
      }}>
      <AppText variant="body" color="rgba(255,255,255,0.85)">
        Redirigiendo…
      </AppText>
    </View>
  );
}
