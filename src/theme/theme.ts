import { Colors } from './colors';
import { Radius, Shadows, Spacing } from './layout';
import { FontFamilies, Typography } from './typography';

export const theme = {
  colors: Colors,
  spacing: Spacing,
  radius: Radius,
  shadows: Shadows,
  fonts: FontFamilies,
  typography: Typography,
} as const;

export type Theme = typeof theme;
export * from './colors';
export * from './layout';
export * from './typography';