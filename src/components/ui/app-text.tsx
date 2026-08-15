import { StyleSheet, Text as RNText, type TextProps, type TextStyle } from 'react-native';

import { Colors } from '@/theme/colors';
import { Typography, type TypographyVariant } from '@/theme/typography';

export type AppTextProps = TextProps & {
  variant?: TypographyVariant;
  color?: string;
  style?: TextStyle | TextStyle[];
};

export function AppText({
  variant = 'body',
  color = Colors.text,
  style,
  ...rest
}: AppTextProps) {
  return <RNText style={[styles.base, Typography[variant], { color }, style]} {...rest} />;
}

const styles = StyleSheet.create({
  base: {
    textAlign: 'left',
  },
});