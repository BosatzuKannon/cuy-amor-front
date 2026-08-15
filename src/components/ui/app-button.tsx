import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, type PressableProps, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors } from '@/theme/colors';
import { Radius, Shadows, Spacing } from '@/theme/layout';

type ButtonVariant = 'solid' | 'outlined';
type ButtonColor = 'primary' | 'secondary';
type ButtonSize = 'sm' | 'md' | 'lg';

export type AppButtonProps = PressableProps & {
  label: string;
  variant?: ButtonVariant;
  color?: ButtonColor;
  size?: ButtonSize;
  loading?: boolean;
  pill?: boolean;
  fullWidth?: boolean;
  iconLeft?: ReactNode;
  style?: ViewStyle | ViewStyle[];
};

const COLOR_PALETTE: Record<ButtonColor, { bg: string; fg: string }> = {
  primary: { bg: Colors.primary, fg: Colors.textOnPrimary },
  secondary: { bg: Colors.secondary, fg: Colors.white },
};

const SIZE_STYLES: Record<ButtonSize, { px: number; py: number; typo: 'label' | 'tag' }> = {
  sm: { px: Spacing.lg, py: Spacing.sm, typo: 'tag' },
  md: { px: Spacing.xl, py: Spacing.md, typo: 'label' },
  lg: { px: Spacing.xl, py: Spacing.lg, typo: 'label' },
};

export function AppButton({
  label,
  variant = 'solid',
  color = 'primary',
  size = 'md',
  loading = false,
  pill = false,
  fullWidth = false,
  iconLeft,
  disabled,
  style,
  ...rest
}: AppButtonProps) {
  const palette = COLOR_PALETTE[color];
  const sizing = SIZE_STYLES[size];
  const isSolid = variant === 'solid';
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        fullWidth && styles.fullWidth,
        {
          paddingHorizontal: sizing.px,
          paddingVertical: sizing.py,
          borderRadius: pill ? Radius.pill : Radius.md,
        },
        isSolid
          ? { backgroundColor: palette.bg, ...Shadows.button }
          : {
              backgroundColor: Colors.white,
              borderWidth: 1.5,
              borderColor: palette.bg,
            },
        pressed && isSolid && styles.pressedSolid,
        pressed && !isSolid && styles.pressedOutlined,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator size="small" color={isSolid ? palette.fg : palette.bg} />
      ) : (
        <>
          {iconLeft}
          <AppText variant={sizing.typo} color={isSolid ? palette.fg : palette.bg}>
            {label}
          </AppText>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  fullWidth: {
    width: '100%',
  },
  pressedSolid: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  pressedOutlined: {
    backgroundColor: Colors.neutral,
  },
  disabled: {
    opacity: 0.5,
  },
});