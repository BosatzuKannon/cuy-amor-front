import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Spacing } from '@/theme/layout';

const BADGE_GRADIENT = ['#FFE082', '#FFB300', '#FF8F00'] as const;
const BADGE_TEXT_COLOR = '#3B1F00';

type HighlyRequestedBadgeProps = {
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
};

export function HighlyRequestedBadge({
  style,
  compact = false,
}: HighlyRequestedBadgeProps) {
  return (
    <View style={[styles.wrapper, style]}>
      <LinearGradient
        colors={BADGE_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, compact && styles.gradientCompact]}>
        <AppText
          variant="tag"
          color={BADGE_TEXT_COLOR}
          style={[styles.text, compact && styles.textCompact]}
          numberOfLines={1}>
          🔥 Cuy muy solicitado
        </AppText>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    shadowColor: '#FFB300',
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  gradient: {
    borderRadius: 999,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
  },
  gradientCompact: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xxs + 1,
  },
  text: {
    color: BADGE_TEXT_COLOR,
    fontWeight: '800',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  textCompact: {
    fontSize: 11,
    lineHeight: 14,
  },
});
