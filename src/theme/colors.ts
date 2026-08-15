export const Colors = {
  primary: '#DC143C',
  secondary: '#E2725B',
  tertiary: '#8B4513',
  neutral: '#F8F9FA',
  white: '#FFFFFF',
  text: '#1B1B1F',
  textMuted: '#6B7280',
  textOnPrimary: '#FFFFFF',
  border: '#E5E7EB',
  danger: '#DC2626',
  success: '#16A34A',
} as const;

export type BrandColor = keyof typeof Colors;