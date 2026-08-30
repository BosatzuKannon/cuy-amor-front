import { AntDesign } from '@expo/vector-icons';

import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Colors } from '@/theme/colors';
import { Radius, Shadows, Spacing } from '@/theme/layout';

export const REPORT_REASONS = [
  'Spam',
  'Comportamiento inapropiado',
  'Perfil falso',
] as const;

type ViewKind = 'menu' | 'block' | 'report';

type UserActionsModalProps = {
  visible: boolean;
  userName: string;
  onClose: () => void;
  onBlock: () => void;
  onReport: (reason: string) => void;
};

export function UserActionsModal({
  visible,
  userName,
  onClose,
  onBlock,
  onReport,
}: UserActionsModalProps) {
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<ViewKind>('menu');
  const [prevVisible, setPrevVisible] = useState(visible);

  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setView('menu');
    }
  }

  const goBackToMenu = () => setView('menu');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.md }]}
          onPress={() => {}}>
          <View style={styles.grabber} />

          {view === 'menu' ? (
            <>
              <AppText variant="h3" color={Colors.text} style={styles.title}>
                Opciones
              </AppText>
              <Pressable
                onPress={() => setView('block')}
                style={({ pressed }) => [
                  styles.row,
                  pressed && styles.rowPressed,
                ]}>
                <AntDesign name="block" size={22} color={Colors.danger} />
                <AppText variant="label" color={Colors.danger}>
                  Bloquear usuario
                </AppText>
              </Pressable>
              <Pressable
                onPress={() => setView('report')}
                style={({ pressed }) => [
                  styles.row,
                  pressed && styles.rowPressed,
                ]}>
                <AntDesign name="warning" size={22} color={Colors.primary} />
                <AppText variant="label" color={Colors.text}>
                  Reportar usuario
                </AppText>
              </Pressable>
            </>
          ) : null}

          {view === 'block' ? (
            <>
              <View style={styles.subHeader}>
                <Pressable
                  onPress={goBackToMenu}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Volver"
                  style={({ pressed }) => [
                    styles.roundButton,
                    pressed && styles.rowPressed,
                  ]}>
                  <AntDesign name="left" size={18} color={Colors.text} />
                </Pressable>
                <AppText
                  variant="h3"
                  color={Colors.text}
                  style={styles.subHeaderTitle}>
                  Bloquear usuario
                </AppText>
              </View>
              <AppText variant="body" color={Colors.textMuted} style={styles.bodyText}>
                ¿Estás seguro? Se eliminará el match y no podrán volver a
                contactarse.
              </AppText>
              <View style={styles.buttonRow}>
                <Pressable
                  onPress={onClose}
                  style={({ pressed }) => [
                    styles.outlineButton,
                    pressed && styles.outlineButtonPressed,
                  ]}>
                  <AppText variant="label" color={Colors.text}>
                    Cancelar
                  </AppText>
                </Pressable>
                <Pressable
                  onPress={onBlock}
                  style={({ pressed }) => [
                    styles.dangerButton,
                    pressed && styles.dangerButtonPressed,
                  ]}>
                  <AppText variant="label" color={Colors.white}>
                    Bloquear
                  </AppText>
                </Pressable>
              </View>
            </>
          ) : null}

          {view === 'report' ? (
            <>
              <View style={styles.subHeader}>
                <Pressable
                  onPress={goBackToMenu}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Volver"
                  style={({ pressed }) => [
                    styles.roundButton,
                    pressed && styles.rowPressed,
                  ]}>
                  <AntDesign name="left" size={18} color={Colors.text} />
                </Pressable>
                <AppText
                  variant="h3"
                  color={Colors.text}
                  style={styles.subHeaderTitle}>
                  Reportar usuario
                </AppText>
              </View>
              <AppText variant="body" color={Colors.textMuted} style={styles.bodyText}>
                ¿Por qué reportas a {userName}?
              </AppText>
              {REPORT_REASONS.map((reason) => (
                <Pressable
                  key={reason}
                  onPress={() => onReport(reason)}
                  style={({ pressed }) => [
                    styles.row,
                    pressed && styles.rowPressed,
                  ]}>
                  <AppText variant="label" color={Colors.text}>
                    {reason}
                  </AppText>
                  <AntDesign name="right" size={16} color={Colors.textMuted} />
                </Pressable>
              ))}
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.neutral,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    ...Shadows.card,
  },
  grabber: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: Radius.pill,
    backgroundColor: Colors.border,
    marginBottom: Spacing.md,
  },
  title: {
    paddingBottom: Spacing.sm,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  subHeaderTitle: {
    flex: 1,
  },
  roundButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(27,27,31,0.06)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.lg,
  },
  rowPressed: {
    backgroundColor: 'rgba(27,27,31,0.06)',
  },
  bodyText: {
    paddingBottom: Spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  outlineButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  outlineButtonPressed: {
    backgroundColor: Colors.neutral,
  },
  dangerButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.danger,
    ...Shadows.button,
  },
  dangerButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
});