import { AntDesign } from '@expo/vector-icons';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors } from '@/theme/colors';
import { Radius, Shadows, Spacing } from '@/theme/layout';

type Props = {
  visible: boolean;
  loading: boolean;
  score: number | null;
  headline: string | null;
  tips: string[];
  onClose: () => void;
};

function scoreColor(score: number): string {
  if (score >= 8) {
    return Colors.success;
  }
  if (score >= 5) {
    return Colors.gold;
  }
  return Colors.primary;
}

export function AiProfileRoastModal({
  visible,
  loading,
  score,
  headline,
  tips,
  onClose,
}: Props) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <AntDesign name="message" size={18} color={Colors.gold} />
            </View>
            <AppText variant="h3" color={Colors.text} style={styles.title}>
              Asesor de Perfil
            </AppText>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <AppText variant="body" color={Colors.textMuted} style={styles.loadingText}>
                Analizando tu perfil con la IA…
              </AppText>
            </View>
          ) : (
            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.body}>
              {score !== null ? (
                <View style={styles.scoreBox}>
                  <AppText
                    variant="h1"
                    color={scoreColor(score)}
                    style={styles.scoreNumber}>
                    {score}
                  </AppText>
                  <AppText variant="bodyMedium" color={Colors.textMuted}>
                    / 10 según la IA
                  </AppText>
                </View>
              ) : null}

              {headline ? (
                <AppText variant="bodyMedium" color={Colors.text} style={styles.headline}>
                  {headline}
                </AppText>
              ) : null}

              {tips.length > 0 ? (
                <View style={styles.tipsCard}>
                  <AppText variant="tag" color={Colors.textMuted} style={styles.tipsTitle}>
                    CONSEJOS PARA MEJORAR
                  </AppText>
                  {tips.map((tip, index) => (
                    <View key={`${index}-${tip.slice(0, 12)}`} style={styles.tipRow}>
                      <View style={styles.tipBullet}>
                        <AppText variant="tag" color={Colors.primary}>
                          {index + 1}
                        </AppText>
                      </View>
                      <AppText variant="body" color={Colors.text} style={styles.tipText}>
                        {tip}
                      </AppText>
                    </View>
                  ))}
                </View>
              ) : null}
            </ScrollView>
          )}

          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.closeButtonPressed,
            ]}>
            <AppText variant="label" color={Colors.primary}>
              Cerrar
            </AppText>
          </Pressable>
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
    maxHeight: '85%',
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
    ...Shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,215,0,0.14)',
  },
  title: {
    flex: 1,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  loadingText: {
    textAlign: 'center',
  },
  body: {
    gap: Spacing.lg,
  },
  scoreBox: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.neutral,
    borderRadius: Radius.lg,
  },
  scoreNumber: {
    textAlign: 'center',
  },
  headline: {
    textAlign: 'center',
  },
  tipsCard: {
    backgroundColor: Colors.neutral,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  tipsTitle: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  tipBullet: {
    width: 24,
    height: 24,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(220,20,60,0.10)',
  },
  tipText: {
    flex: 1,
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  closeButtonPressed: {
    opacity: 0.5,
  },
});
