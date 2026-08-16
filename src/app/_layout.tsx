import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import Toast from 'react-native-toast-message';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AppBackground } from '@/components/ui/app-background';
import { toastConfig } from '@/components/ui/app-toast';
import { initAuthListener } from '@/lib/auth-listener';
import { useAuthStore } from '@/store/useAuthStore';
import { Colors } from '@/theme/colors';
import { useAppFonts } from '@/theme/use-app-fonts';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useAppFonts();
  const session = useAuthStore((state) => state.session);
  const isLoading = useAuthStore((state) => state.isLoading);
  const profileReady = useAuthStore((state) => state.profileReady);
  const profileComplete = useAuthStore((state) => state.profileComplete);

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