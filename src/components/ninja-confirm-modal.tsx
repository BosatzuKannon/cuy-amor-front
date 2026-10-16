import { AntDesign } from '@expo/vector-icons';
import { Modal, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { Colors } from '@/theme/colors';
import { Radius, Shadows, Spacing } from '@/theme/layout';

type Props = {
  visible: boolean;
  isLeyenda: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function NinjaConfirmModal({
  visible,
  isLeyenda,
  loading = false,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <AntDesign name="eye-invisible" size={28} color={Colors.white} />
          </View>
          <AppText variant="h2" color={Colors.text} style={styles.title}>
            Activar Modo Cuy Ninja
          </AppText>
          <AppText
            variant="bodyMedium"
            color={Colors.textMuted}
            style={styles.message}>
            ¿Estás seguro? Al activar el Modo Ninja, tu perfil se ocultará de la
            pantalla Explorar y nadie podrá verte. No podrás hacer nuevos amigos
            durante estos 7 días.
          </AppText>
          <View style={styles.costPill}>
            <AntDesign name="warning" size={13} color={Colors.primary} />
            <AppText variant="caption" color={Colors.primary} style={styles.costText}>
              {isLeyenda ? 'Gratis para Cuy Leyenda' : 'Costo: 50 Cuy Coins'}
            </AppText>
          </View>
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
              label="Sí, activar"
              variant="solid"
              color="primary"
              loading={loading}
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
    backgroundColor: Colors.primary,
    alignSelf: 'center',
    marginBottom: Spacing.md,
    ...Shadows.button,
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
    backgroundColor: 'rgba(220,20,60,0.10)',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  costText: {
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  action: {
    flex: 1,
  },
});
