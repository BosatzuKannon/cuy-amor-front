import { AntDesign } from '@expo/vector-icons';
import { Modal, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import type { StreakClaimResponse } from '@/services/streak-service';
import { Colors } from '@/theme/colors';
import { Radius, Shadows, Spacing } from '@/theme/layout';

type StreakDayConfig = {
  day: number;
  emoji: string;
  short: string;
  label: string;
};

const STREAK_DAYS: StreakDayConfig[] = [
  { day: 1, emoji: '🪙', short: '+5', label: '5 Cuy Coins' },
  { day: 2, emoji: '🪙', short: '+10', label: '10 Cuy Coins' },
  { day: 3, emoji: '🥷', short: '24h', label: 'Modo Ninja 24h' },
  { day: 4, emoji: '🪙', short: '+15', label: '15 Cuy Coins' },
  { day: 5, emoji: '🐝', short: '+1', label: '1 Zumbido' },
  { day: 6, emoji: '🪙', short: '+20', label: '20 Cuy Coins' },
  { day: 7, emoji: '👑', short: '24h', label: 'Cuy Leyenda 24h' },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  result: StreakClaimResponse | null;
};

function dayState(day: number, loopDay: number): 'done' | 'today' | 'locked' {
  if (day < loopDay) {
    return 'done';
  }
  if (day === loopDay) {
    return 'today';
  }
  return 'locked';
}

export function StreakModal({ visible, onClose, result }: Props) {
  const currentStreak = result?.currentStreak ?? 0;
  const longestStreak = result?.longestStreak ?? 0;
  const loopDay = result?.loopDay ?? 0;
  const items = result?.rewards.items ?? [];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.flameWrap}>
              <AppText variant="h1" color={Colors.white} style={styles.flameEmoji}>
                🔥
              </AppText>
            </View>
            <AppText variant="h2" color={Colors.text} style={styles.title}>
              ¡Racha activa!
            </AppText>
            <AppText
              variant="bodyMedium"
              color={Colors.textMuted}
              style={styles.subtitle}>
              {currentStreak === 1
                ? '¡Empezaste tu racha! Vuelve mañana para mantenerla.'
                : `Llevas ${currentStreak} días seguidos entrando.`}
            </AppText>
          </View>

          <View style={styles.track}>
            {STREAK_DAYS.map((day) => {
              const state = dayState(day.day, loopDay);
              return (
                <View key={day.day} style={styles.dayColumn}>
                  <View
                    style={[
                      styles.dayCircle,
                      state === 'done' && styles.dayCircleDone,
                      state === 'today' && styles.dayCircleToday,
                    ]}>
                    {state === 'done' ? (
                      <AntDesign name="check" size={16} color={Colors.success} />
                    ) : (
                      <AppText style={styles.dayEmoji}>{day.emoji}</AppText>
                    )}
                  </View>
                  <AppText
                    variant="tag"
                    color={state === 'today' ? Colors.primary : Colors.textMuted}
                    style={styles.dayLabel}>
                    D{day.day}
                  </AppText>
                  <AppText
                    variant="tag"
                    color={Colors.textMuted}
                    style={styles.dayReward}>
                    {day.short}
                  </AppText>
                  {state === 'today' ? (
                    <View style={styles.todayPill}>
                      <AppText variant="tag" color={Colors.white}>
                        HOY
                      </AppText>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>

          {items.length > 0 ? (
            <View style={styles.rewardCard}>
              <AppText
                variant="tag"
                color={Colors.textMuted}
                style={styles.rewardTitle}>
                GANASTE HOY
              </AppText>
              {items.map((item) => (
                <View key={item} style={styles.rewardRow}>
                  <View style={styles.rewardIconWrap}>
                    <AntDesign name="gift" size={13} color={Colors.success} />
                  </View>
                  <AppText
                    variant="bodyMedium"
                    color={Colors.text}
                    style={styles.rewardText}>
                    {item}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}

          {longestStreak > 0 ? (
            <View style={styles.recordRow}>
              <AppText variant="caption" color={Colors.textMuted}>
                🔥 Tu récord: {longestStreak}{' '}
                {longestStreak === 1 ? 'día' : 'días'}
              </AppText>
            </View>
          ) : null}

          <AppButton
            label="¡Genial!"
            variant="solid"
            color="primary"
            fullWidth
            onPress={onClose}
            style={styles.cta}
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
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  card: {
    width: '100%',
    maxHeight: '88%',
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    ...Shadows.card,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  flameWrap: {
    width: 64,
    height: 64,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    marginBottom: Spacing.md,
    ...Shadows.button,
  },
  flameEmoji: {
    fontSize: 30,
    lineHeight: 38,
    textAlign: 'center',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  track: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.neutral,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayCircleDone: {
    backgroundColor: 'rgba(22,163,74,0.10)',
    borderColor: 'rgba(22,163,74,0.35)',
  },
  dayCircleToday: {
    backgroundColor: 'rgba(220,20,60,0.10)',
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  dayEmoji: {
    fontSize: 16,
    lineHeight: 20,
  },
  dayLabel: {
    fontSize: 10,
  },
  dayReward: {
    fontSize: 9,
  },
  todayPill: {
    marginTop: 2,
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  rewardCard: {
    backgroundColor: Colors.neutral,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  rewardTitle: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rewardIconWrap: {
    width: 26,
    height: 26,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(22,163,74,0.10)',
  },
  rewardText: {
    flex: 1,
    textAlign: 'left',
  },
  recordRow: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  cta: {
    alignSelf: 'stretch',
  },
});
