import { AntDesign } from '@expo/vector-icons';
import { Modal, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { Colors } from '@/theme/colors';
import { Radius, Shadows, Spacing } from '@/theme/layout';

type Props = {
  visible: boolean;
  onDismiss: () => void;
};

export function SwipeTutorialOverlay({ visible, onDismiss }: Props) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <AppText variant="h2" color={Colors.text} style={styles.title}>
            Descubre con un desliz
          </AppText>
          <AppText
            variant="bodyMedium"
            color={Colors.textMuted}
            style={styles.message}>
            Desliza el perfil para decidir rápido:
          </AppText>

          <View style={styles.rows}>
            <View style={styles.row}>
              <View style={[styles.iconWrap, styles.likeIcon]}>
                <AntDesign name="arrow-right" size={22} color="#DC143C" />
              </View>
              <View style={styles.rowText}>
                <AppText variant="bodyMedium" color={Colors.text}>
                  Desliza a la derecha = <AppText variant="bodyMedium" color={Colors.primary}>Like</AppText>
                </AppText>
                <AppText variant="caption" color={Colors.textMuted}>
                  Muestra interés en ese cuy.
                </AppText>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.iconWrap, styles.passIcon]}>
                <AntDesign name="arrow-left" size={22} color="#4B5563" />
              </View>
              <View style={styles.rowText}>
                <AppText variant="bodyMedium" color={Colors.text}>
                  Desliza a la izquierda = <AppText variant="bodyMedium" color={Colors.textMuted}>Pass</AppText>
                </AppText>
                <AppText variant="caption" color={Colors.textMuted}>
                  Pasa al siguiente perfil.
                </AppText>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.iconWrap, styles.cuyazoIcon]}>
                <AntDesign name="star" size={22} color={Colors.gold} />
              </View>
              <View style={styles.rowText}>
                <AppText variant="bodyMedium" color={Colors.text}>
                  Toca el Cuyazo para destacar
                </AppText>
                <AppText variant="caption" color={Colors.textMuted}>
                  Envía un super like con el botón central.
                </AppText>
              </View>
            </View>
          </View>

          <AppButton
            label="¡Entendido!"
            variant="solid"
            color="primary"
            onPress={onDismiss}
            style={styles.button}
          />
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
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    ...Shadows.card,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  message: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  rows: {
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  likeIcon: {
    backgroundColor: 'rgba(220,20,60,0.12)',
  },
  passIcon: {
    backgroundColor: 'rgba(75,85,99,0.12)',
  },
  cuyazoIcon: {
    backgroundColor: 'rgba(255,215,0,0.18)',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  button: {
    alignSelf: 'stretch',
  },
});
