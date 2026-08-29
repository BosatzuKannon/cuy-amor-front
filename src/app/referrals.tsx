import { AntDesign } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { toast } from '@/lib/toast';
import { useAuthStore } from '@/store/useAuthStore';
import { Colors } from '@/theme/colors';
import { Radius, Shadows, Spacing } from '@/theme/layout';

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export default function ReferralsScreen() {
  const insets = useSafeAreaInsets();
  const profile = useAuthStore((s) => s.profile);
  const referralCode = profile?.referralCode ?? null;
  const referralEarnings = profile?.referralEarnings ?? 0;
  const [copied, setCopied] = useState(false);

  function handleCopyCode() {
    if (!referralCode) return;
    try {
      const Clipboard = require('expo-clipboard');
      Clipboard.setStringAsync(referralCode);
      setCopied(true);
      toast.success('Copiado', 'Código de referido copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.info('Código', referralCode);
    }
  }

  return (
    <ScreenWrapper background="transparent" style={styles.wrapper}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 0 },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Volver"
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backPressed,
            ]}>
            <AntDesign name="left" size={20} color={Colors.white} />
          </Pressable>
          
        </View>

        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <AntDesign name="team" size={32} color={Colors.primary} />
          </View>
          <AppText variant="h2" color={Colors.white} style={styles.headerTitle}>
            Programa de Referidos
          </AppText>
          <AppText
            variant="body"
            color="rgba(255,255,255,0.85)"
            style={styles.headerSubtitle}>
            Invita a tus amigos y gana dinero real con cada compra que hagan.
          </AppText>
        </View>

        <View style={styles.card}>
          <AppText
            variant="tag"
            color={Colors.textMuted}
            style={styles.cardTitle}>
            Tu código de referido
          </AppText>

          <View style={styles.codeContainer}>
            <View style={styles.codeBox}>
              <AppText variant="h2" color={Colors.primary} style={styles.codeText}>
                {referralCode ?? '---'}
              </AppText>
            </View>
            {referralCode && (
              <Pressable
                onPress={handleCopyCode}
                style={({ pressed }) => [
                  styles.copyButton,
                  pressed && styles.copyPressed,
                ]}>
                <AntDesign
                  name={copied ? 'check' : 'copy'}
                  size={18}
                  color={Colors.white}
                />
              </Pressable>
            )}
          </View>

          <AppText
            variant="caption"
            color={Colors.textMuted}
            style={styles.codeHint}>
            Comparte este código con tus amigos para que lo usen al registrarse.
          </AppText>
        </View>

        <View style={styles.card}>
          <AppText
            variant="tag"
            color={Colors.textMuted}
            style={styles.cardTitle}>
            Ganancias por referidos
          </AppText>

          <View style={styles.earningsRow}>
            <View style={styles.earningsIconWrap}>
              <Image
                source={require('@/assets/images/coinn.png')}
                style={styles.earningsCoinIcon}
                contentFit="contain"
              />
            </View>
            <View style={styles.earningsBody}>
              <AppText
                variant="caption"
                color={Colors.textMuted}
                style={styles.earningsLabel}>
                Total ganado
              </AppText>
              <AppText
                variant="h3"
                color={Colors.text}
                style={styles.earningsValue}>
                {copFormatter.format(referralEarnings)}
              </AppText>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <AppText
            variant="tag"
            color={Colors.textMuted}
            style={styles.cardTitle}>
            ¿Cómo funciona?
          </AppText>

          <View style={styles.stepRow}>
            <View style={[styles.stepDot, { backgroundColor: Colors.primary }]}>
              <AppText variant="label" color={Colors.white}>
                1
              </AppText>
            </View>
            <View style={styles.stepBody}>
              <AppText variant="bodyMedium" color={Colors.text} style={styles.stepTitle}>
                Comparte tu código
              </AppText>
              <AppText variant="caption" color={Colors.textMuted}>
                Envía tu código de referido a tus amigos por WhatsApp, redes
                sociales o en persona.
              </AppText>
            </View>
          </View>

          <View style={styles.stepDivider} />

          <View style={styles.stepRow}>
            <View style={[styles.stepDot, { backgroundColor: Colors.secondary }]}>
              <AppText variant="label" color={Colors.white}>
                2
              </AppText>
            </View>
            <View style={styles.stepBody}>
              <AppText variant="bodyMedium" color={Colors.text} style={styles.stepTitle}>
                Ellos se registran
              </AppText>
              <AppText variant="caption" color={Colors.textMuted}>
                Tu amigo ingresa tu código al crear su cuenta en Cuy Amor.
              </AppText>
            </View>
          </View>

          <View style={styles.stepDivider} />

          <View style={styles.stepRow}>
            <View style={[styles.stepDot, { backgroundColor: Colors.success }]}>
              <AppText variant="label" color={Colors.white}>
                3
              </AppText>
            </View>
            <View style={styles.stepBody}>
              <AppText variant="bodyMedium" color={Colors.text} style={styles.stepTitle}>
                Ganas dinero real
              </AppText>
              <AppText variant="caption" color={Colors.textMuted}>
                Recibes el 10% del valor de su primera compra de paquete de
                monedas (excepto Cuy Leyenda).
              </AppText>
            </View>
          </View>
        </View>

        <AppButton
          label="Compartir código"
          variant="solid"
          pill
          fullWidth
          iconLeft={
            <AntDesign name="share-alt" size={18} color={Colors.white} />
          }
          onPress={handleCopyCode}
          disabled={!referralCode}
          style={styles.shareButton}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  scroll: {
    flex: 1,
    width: '100%',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xxs,
  },
  topBarTitle: {
    textAlign: 'left',
    flexShrink: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  backPressed: {
    opacity: 0.6,
  },
  header: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: Spacing.xl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    textAlign: 'center',
  },
  headerSubtitle: {
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.neutral,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    ...Shadows.card,
  },
  cardTitle: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.md,
    alignSelf: 'flex-start',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    width: '100%',
  },
  codeBox: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  codeText: {
    textAlign: 'center',
    letterSpacing: 3,
    fontWeight: '700',
  },
  copyButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    ...Shadows.button,
  },
  copyPressed: {
    opacity: 0.7,
  },
  codeHint: {
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 18,
  },
  earningsRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadows.button,
  },
  earningsIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,215,0,0.15)',
  },
  earningsCoinIcon: {
    width: 28,
    height: 28,
  },
  earningsBody: {
    flex: 1,
    gap: Spacing.xxs,
  },
  earningsLabel: {
    textAlign: 'left',
  },
  earningsValue: {
    textAlign: 'left',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    width: '100%',
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBody: {
    flex: 1,
    gap: Spacing.xxs,
  },
  stepTitle: {
    textAlign: 'left',
  },
  stepDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 48,
    marginVertical: Spacing.md,
  },
  shareButton: {
    width: '100%',
    marginTop: Spacing.sm,
  },
});
