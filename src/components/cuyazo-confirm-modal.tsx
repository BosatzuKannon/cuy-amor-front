import { Image } from 'expo-image';
import { Modal, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { Colors } from '@/theme/colors';
import { Radius, Shadows, Spacing } from '@/theme/layout';

const CUYAZO_COST_IN_COINS = 15;

type Props = {
  visible: boolean;
  isFree: boolean;
  coinsBalance: number;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function CuyazoConfirmModal({
  visible,
  isFree,
  coinsBalance,
  loading = false,
  onCancel,
  onConfirm,
}: Props) {
  const hasEnoughCoins = coinsBalance >= CUYAZO_COST_IN_COINS;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Image
              source={require('@/assets/images/cuyazoo.png')}
              style={styles.icon}
              contentFit="contain"
            />
          </View>
          <AppText variant="h2" color={Colors.text} style={styles.title}>
            Enviar un Cuyazo
          </AppText>
          <AppText
            variant="bodyMedium"
            color={Colors.textMuted}
            style={styles.message}>
            {isFree
              ? '¿Estás seguro? Enviarás un Cuyazo destacado usando tu cupo diario de Cuy Leyenda.'
              : '¿Estás seguro? El Cuyazo destaca tu perfil y no se puede deshacer. Se descontarán 15 Cuy Coins de tu saldo.'}
          </AppText>
          <View style={styles.costPill}>
            <Image
              source={require('@/assets/images/coinn.png')}
              style={styles.costIcon}
              contentFit="contain"
            />
            <AppText
              variant="caption"
              color={isFree ? Colors.success : Colors.primary}
              style={styles.costText}>
              {isFree
                ? 'Gratis · Usa tu Cuyazo diario de Leyenda'
                : `Costo: ${CUYAZO_COST_IN_COINS} Cuy Coins`}
            </AppText>
          </View>
          {!isFree && !hasEnoughCoins ? (
            <AppText variant="caption" color={Colors.danger} style={styles.warning}>
              Tu saldo actual ({coinsBalance}) no es suficiente.
            </AppText>
          ) : null}
          <View style={styles.actions}>
            <AppButton
              label="Cancelar"
              variant="outlined"
              color="primary"
              disabled={loading}
              onPress={onCancel}
              style={styles.action}
            />
            <AppButton
              label="Sí, enviar"
              variant="solid"
              color="primary"
              loading={loading}
              disabled={!isFree && !hasEnoughCoins}
              onPress={onConfirm}
              style={styles.action}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    ...Shadows.card,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245,158,11,0.15)',
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  icon: {
    width: 42,
    height: 42,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  costPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    alignSelf: 'center',
    backgroundColor: 'rgba(245,158,11,0.10)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  costIcon: {
    width: 16,
    height: 16,
  },
  costText: {
    fontWeight: '600',
  },
  warning: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  action: {
    flex: 1,
  },
});
