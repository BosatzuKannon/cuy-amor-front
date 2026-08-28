import { AntDesign } from '@expo/vector-icons';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { supabase } from '@/lib/supabase';
import { handleAuthUrl } from '@/lib/auth-listener';
import { AppBackground } from '@/components/ui/app-background';
import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { Colors } from '@/theme/colors';
import { Radius, Shadows, Spacing } from '@/theme/layout';

WebBrowser.maybeCompleteAuthSession();

export default function WelcomeScreen() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  async function handleGoogleLogin() {
    setIsGoogleLoading(true);
    try {
      const redirectUrl = makeRedirectUri({ scheme: 'frontcuyamor' });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        throw error;
      }

      if (!data.url) {
        console.log('[index] signInWithOAuth did not return a URL');
        return;
      }

      console.log('[index] Opening auth session, flowId:', data.flowId, '| url:', data.url);
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      console.log('[index] openAuthSessionAsync result type:', result.type);

      if (result.type === 'success') {
        if (result.url) {
          console.log('[index] Handling return URL:', result.url);
          await handleAuthUrl(result.url);
        } else {
          console.log('[index] Success result missing URL; relying on deep link event');
        }
      } else {
        console.log('[index] Auth session cancelled or dismissed');
      }
    } catch (err) {
      console.log('Google sign-in failed', err);
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <AppBackground />

      <ScreenWrapper background="transparent" style={styles.wrapper}>
        <View style={styles.hero}>
          <View style={styles.brandRow}>
            <View style={styles.brandDot} />
            <AppText variant="tag" color="rgba(255,255,255,0.85)">
              CONECTA. COMPARTE. VIVE Y GANA DINERO.
            </AppText>
          </View>

          <AppText variant="display" color={Colors.white} style={styles.heroTitle}>
            Cuy Amor
          </AppText>
          <AppText variant="body" color="rgba(255,255,255,0.9)" style={styles.heroSubtitle}>
            Encuentra tu conexión local en el corazón de Nariño. Música, momentos y
            personas que se sienten como en casa.
          </AppText>
        </View>

        <View style={styles.bottomCard}>
          <View style={styles.featureRow}>
            <View style={styles.featureItem}>
              <AntDesign name="heart" size={22} color={Colors.primary} />
              <AppText
                variant="tag"
                color={Colors.text}
                style={styles.featureLabel}
                numberOfLines={1}
                adjustsFontSizeToFit>
                Match local
              </AppText>
            </View>
            <View style={styles.featureItem}>
              <AntDesign name="message" size={22} color={Colors.secondary} />
              <AppText
                variant="tag"
                color={Colors.text}
                style={styles.featureLabel}
                numberOfLines={1}
                adjustsFontSizeToFit>
                Chats en vivo
              </AppText>
            </View>
            <View style={styles.featureItem}>
              <AntDesign name="gift" size={22} color={Colors.tertiary} />
              <AppText
                variant="tag"
                color={Colors.text}
                style={styles.featureLabel}
                numberOfLines={1}
                adjustsFontSizeToFit>
                Regalos
              </AppText>
            </View>
          </View>

          <AppButton
            label="Continue with Google"
            variant="solid"
            color="primary"
            size="lg"
            pill
            fullWidth
            loading={isGoogleLoading}
            onPress={handleGoogleLogin}
            iconLeft={<AntDesign name="google" size={20} color={Colors.white} />}
          />

          {/* TODO: Translate to "¿Problemas para iniciar sesión?" and implement recovery logic later. */}
          {/*
          <Pressable
            onPress={() => console.log('Trouble signing in pressed')}
            hitSlop={Spacing.md}
            accessibilityRole="button"
            accessibilityLabel="Trouble signing in?"
            style={styles.signInHelp}>
            <AppText variant="tag" color={Colors.textMuted}>
              Trouble signing in?
            </AppText>
          </Pressable>
          */}
        </View>
      </ScreenWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  wrapper: {
    paddingHorizontal: Spacing.xl,
  },
  hero: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: Radius.pill,
    backgroundColor: '#25D366',
  },
  heroTitle: {
    fontSize: 56,
    lineHeight: 60,
    letterSpacing: -1,
  },
  heroSubtitle: {
    maxWidth: 340,
  },
  bottomCard: {
    width: '100%',
    backgroundColor: Colors.neutral,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
    ...Shadows.card,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-start',
    width: '100%',
  },
  featureItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
  },
  featureLabel: {
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 4,
    flexShrink: 1,
  },
  signInHelp: {
    alignItems: 'flex-start',
  },
});