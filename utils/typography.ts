import { TextStyle, Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  default: {
    regular: 'normal',
    medium: 'normal',
    semibold: 'bold',
    bold: 'bold',
  },
});

export const Typography = {
  xs: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: fontFamily.regular,
  } as TextStyle,
  sm: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: fontFamily.regular,
  } as TextStyle,
  base: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: fontFamily.regular,
  } as TextStyle,
  lg: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: fontFamily.regular,
  } as TextStyle,
  xl: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: fontFamily.medium,
  } as TextStyle,
  '2xl': {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: fontFamily.semibold,
  } as TextStyle,
  '3xl': {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: fontFamily.bold,
  } as TextStyle,
  '4xl': {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: fontFamily.bold,
  } as TextStyle,
} as const;

export type TypographyKey = keyof typeof Typography;
