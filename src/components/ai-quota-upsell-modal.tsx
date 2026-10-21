import { AntDesign } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { CuyLeyendaModal } from '@/components/cuy-leyenda-modal';
import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { Colors } from '@/theme/colors';
import { Radius, Shadows, Spacing } from '@/theme/layout';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function AiQuotaUpsellModal({ visible, onClose }: Props) {
  const [showLeyenda, setShowLeyenda] = useState(false);

  return (
    <>
      <Modal
        transparent
        visible={visible && !showLeyenda}
        animationType="fade"
        onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <View style={styles.iconWrap}>
              <AntDesign name="star" size={28} color={Colors.gold} />
            </View>

            <AppText variant="h2" color={Colors.text} style={styles.title}>
              Se te acabó la IA de hoy
            </AppText>
            <AppText variant="body" color={Colors.textMuted} style={styles.body}>
              Los usuarios gratis tienen 1 uso de IA al día. Vuélvete Cuy
              Leyenda y desbloquea 10 usos diarios, además de todos los
              beneficios premium.
            </AppText>

            <AppButton
              label="Hazte Cuy Leyenda"
              variant="solid"
              color="primary"
              fullWidth
              onPress={() => setShowLeyenda(true)}
            />

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.laterButton,
                pressed && styles.laterButtonPressed,
              ]}>
              <AppText variant="label" color={Colors.primary}>
                Más tarde
              </AppText>
            </Pressable>
          </View>
        </View>
      </Modal>

      <CuyLeyendaModal
        visible={showLeyenda}
        onClose={() => {
          setShowLeyenda(false);
          onClose();
        }}
      />
    </>
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
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.lg,
    ...Shadows.card,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,215,0,0.14)',
  },
  title: {
    textAlign: 'center',
  },
  body: {
    textAlign: 'center',
  },
  laterButton: {
    paddingVertical: Spacing.sm,
  },
  laterButtonPressed: {
    opacity: 0.5,
  },
});
