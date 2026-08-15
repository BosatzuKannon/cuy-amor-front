import { Platform } from 'react-native';

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const Shadows = {
  card: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
    },
    android: {
      elevation: 5,
    },
    default: {
      boxShadow: '0px 6px 12px rgba(0,0,0,0.10)',
    },
  }),
  button: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
    },
    android: {
      elevation: 4,
    },
    default: {
      boxShadow: '0px 4px 8px rgba(0,0,0,0.18)',
    },
  }),
} as const;