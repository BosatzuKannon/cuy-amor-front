import { AntDesign } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { formatCop } from '@/lib/currency';
import { toast } from '@/lib/toast';
import { requestPayout } from '@/services/wallet-service';
import { useAuthStore } from '@/store/useAuthStore';
import { Colors } from '@/theme/colors';
import { Radius, Shadows, Spacing } from '@/theme/layout';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MIN_CENTS = 3000000;

export default function PayoutScreen() {
  const insets = useSafeAreaInsets();
  const profile = useAuthStore((s) => s.profile);
  const cashBalance = profile?.cashBalanceInCents ?? 0;

  const [nequiNumber, setNequiNumber] = useState('');
  const [amountCop, setAmountCop] = useState('');
  const [loading, setLoading] = useState(false);

  const amountCents = Math.round(parseFloat(amountCop.replace(/[^0-9.]/g, '')) * 100);
  const isValid =
    nequiNumber.trim().length >= 8 &&
    Number.isFinite(amountCents) &&
    amountCents >= MIN_CENTS &&
    amountCents <= cashBalance;

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/profile');
    }
  }

  async function handleRequest() {
    if (!isValid || loading) return;
    setLoading(true);
    try {
      await requestPayout({
        nequiNumber: nequiNumber.trim(),
        amountInCents: amountCents,
      });
      toast.success(
        'Solicitud enviada',
        'Tu retiro está siendo procesado. Recibirás el dinero pronto.',
      );
      router.back();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? 'No pudimos procesar tu solicitud. Intenta de nuevo.';
      toast.error('Error', Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
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
            onPress={handleBack}
            hitSlop={12}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <AntDesign name="left" size={20} color={Colors.white} />
          </Pressable>
          <AppText variant="h3" color={Colors.white} style={styles.title}>
            Solicitar Retiro
          </AppText>
        </View>

        <View style={styles.balanceCard}>
          <View style={styles.balanceIconWrap}>
            <AntDesign name="wallet" size={18} color={Colors.primary} />
          </View>
          <View style={styles.balanceBody}>
            <AppText variant="caption" color={Colors.textMuted}>
              Saldo disponible
            </AppText>
            <AppText variant="h3" color={Colors.text}>
              {formatCop(cashBalance)}
            </AppText>
          </View>
        </View>

        <View style={styles.card}>
          <AppText variant="tag" color={Colors.textMuted} style={styles.cardTitle}>
            Datos del retiro
          </AppText>

          <AppText variant="label" color={Colors.text} style={styles.inputLabel}>
            Número de Nequi
          </AppText>
          <View style={styles.inputWrap}>
            <AntDesign name="mobile" size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              value={nequiNumber}
              onChangeText={setNequiNumber}
              placeholder="Ej: 3001234567"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
              maxLength={15}
              style={styles.textInput}
            />
          </View>

          <AppText variant="label" color={Colors.text} style={styles.inputLabel}>
            Monto a retirar (COP)
          </AppText>
          <View style={styles.inputWrap}>
            <AppText variant="bodyMedium" color={Colors.textMuted} style={styles.inputIcon}>
              $
            </AppText>
            <TextInput
              value={amountCop}
              onChangeText={setAmountCop}
              placeholder="Mínimo $30.000"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              maxLength={12}
              style={styles.textInput}
            />
          </View>

          {amountCents > cashBalance && amountCents > 0 && (
            <AppText variant="caption" color={Colors.danger} style={styles.errorText}>
              El monto excede tu saldo disponible
            </AppText>
          )}

          {amountCents > 0 && amountCents < MIN_CENTS && (
            <AppText variant="caption" color={Colors.danger} style={styles.errorText}>
              El monto mínimo de retiro es $30.000 COP
            </AppText>
          )}
        </View>

        <AppButton
          label={loading ? 'Procesando...' : 'Solicitar retiro'}
          variant="solid"
          pill
          fullWidth
          disabled={!isValid || loading}
          onPress={handleRequest}
          style={styles.submitButton}>
          {loading && <ActivityIndicator color={Colors.white} size="small" style={styles.spinner} />}
        </AppButton>

        <AppText variant="caption" color="rgba(255,255,255,0.7)" style={styles.hint}>
          Los retiros se procesan a través de Nequi. El dinero llegará en máximo 24 horas hábiles.
        </AppText>
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  title: {
    textAlign: 'left',
    flexShrink: 1,
  },
  balanceCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    elevation: 0,
    shadowOpacity: 0,
  },
  balanceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(220,20,60,0.12)',
  },
  balanceBody: {
    flex: 1,
    gap: Spacing.xxs,
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    elevation: 0,
    shadowOpacity: 0,
  },
  cardTitle: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.md,
  },
  inputLabel: {
    textAlign: 'left',
    marginBottom: Spacing.sm,
  },
  inputWrap: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  inputIcon: {
    width: 20,
    textAlign: 'center',
  },
  inputText: {
    flex: 1,
    textAlign: 'left',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    padding: 0,
  },
  errorText: {
    textAlign: 'left',
    marginTop: Spacing.xs,
  },
  submitButton: {
    width: '100%',
    marginBottom: Spacing.md,
  },
  spinner: {
    marginLeft: Spacing.sm,
  },
  hint: {
    textAlign: 'center',
    lineHeight: 18,
  },
});
