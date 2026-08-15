export const FontFamilies = {
  body: 'BeVietnamPro',
  label: 'WorkSans',
} as const;

export type FontFamily = keyof typeof FontFamilies;

export const Typography = {
  display: {
    fontFamily: `${FontFamilies.body}_700Bold`,
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '700',
  },
  h1: {
    fontFamily: `${FontFamilies.body}_700Bold`,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
  },
  h2: {
    fontFamily: `${FontFamilies.body}_600SemiBold`,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
  },
  h3: {
    fontFamily: `${FontFamilies.body}_600SemiBold`,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
  },
  body: {
    fontFamily: `${FontFamilies.body}_400Regular`,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  bodyMedium: {
    fontFamily: `${FontFamilies.body}_500Medium`,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  caption: {
    fontFamily: `${FontFamilies.body}_400Regular`,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  label: {
    fontFamily: `${FontFamilies.label}_600SemiBold`,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  tag: {
    fontFamily: `${FontFamilies.label}_500Medium`,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
} as const;

export type TypographyVariant = keyof typeof Typography;