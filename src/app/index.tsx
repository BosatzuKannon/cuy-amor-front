import { AntDesign } from '@expo/vector-icons';
import { makeRedirectUri } from 'expo-auth-session';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { supabase } from '@/lib/supabase';
import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { Colors } from '@/theme/colors';
import { Radius, Shadows, Spacing } from '@/theme/layout';

WebBrowser.maybeCompleteAuthSession();

function FloatingShape({
  style,
  color,
}: {
  style: object;
  color: string;
}) {
  return <View style={[styles.shape, { backgroundColor: color }, style]} />;
}

export default function WelcomeScreen() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  async function handleGoogleLogin() {
    setIsGoogleLoading(true);
    try {
      const redirectUrl = makeRedirectUri({ scheme: 'frontcuyamor' });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl },
      });

      if (error) {
        throw error;
      }

      if (data.url) {
        await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      }
    } catch (err) {
      console.log('Google sign-in failed', err);
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <FloatingShape color="rgba(255,255,255,0.14)" style={styles.shapeOne} />
      <FloatingShape color="rgba(139,69,19,0.28)" style={styles.shapeTwo} />
      <FloatingShape color="rgba(255,255,255,0.10)" style={styles.shapeThree} />

      <ScreenWrapper background="transparent" style={styles.wrapper}>
        <View style={styles.hero}>
          <View style={styles.brandRow}>
            <View style={styles.brandDot} />
            <AppText variant="tag" color="rgba(255,255,255,0.85)">
              CONECTA. COMPARTE. VIVE
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
              <AppText variant="tag" color={Colors.text} style={styles.featureLabel}>
                Match local
              </AppText>
            </View>
            <View style={styles.featureItem}>
              <AntDesign name="message" size={22} color={Colors.secondary} />
              <AppText variant="tag" color={Colors.text} style={styles.featureLabel}>
                Chats en vivo
              </AppText>
            </View>
            <View style={styles.featureItem}>
              <AntDesign name="gift" size={22} color={Colors.tertiary} />
              <AppText variant="tag" color={Colors.text} style={styles.featureLabel}>
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
  shape: {
    position: 'absolute',
    borderRadius: Radius.pill,
  },
  shapeOne: {
    width: 260,
    height: 260,
    top: -70,
    right: -80,
  },
  shapeTwo: {
    width: 180,
    height: 180,
    top: 200,
    left: -70,
  },
  shapeThree: {
    width: 120,
    height: 120,
    top: '55%',
    right: -40,
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
    backgroundColor: Colors.white,
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
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  featureLabel: {
    textTransform: 'uppercase',
  },
  signInHelp: {
    alignItems: 'flex-start',
  },
});