/**
 * Invox Typography System
 * Using Inter font family for a clean, modern look
 */

import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export const fontSizes = {
  xs: 11,
  sm: 12,
  body: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
};

export const lineHeights = {
  xs: 16,
  sm: 18,
  body: 22,
  md: 24,
  lg: 28,
  xl: 30,
  '2xl': 32,
  '3xl': 36,
  '4xl': 40,
  '5xl': 48,
};

export const typography = {
  // Display
  displayLarge: {
    fontFamily,
    fontSize: fontSizes['5xl'],
    lineHeight: lineHeights['5xl'],
    fontWeight: fontWeights.bold,
    letterSpacing: -0.5,
  },
  displayMedium: {
    fontFamily,
    fontSize: fontSizes['4xl'],
    lineHeight: lineHeights['4xl'],
    fontWeight: fontWeights.bold,
    letterSpacing: -0.3,
  },
  displaySmall: {
    fontFamily,
    fontSize: fontSizes['3xl'],
    lineHeight: lineHeights['3xl'],
    fontWeight: fontWeights.bold,
    letterSpacing: -0.2,
  },

  // Headings
  headingLarge: {
    fontFamily,
    fontSize: fontSizes['2xl'],
    lineHeight: lineHeights['2xl'],
    fontWeight: fontWeights.semibold,
    letterSpacing: 0,
  },
  headingMedium: {
    fontFamily,
    fontSize: fontSizes.xl,
    lineHeight: lineHeights.xl,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0,
  },
  headingSmall: {
    fontFamily,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    fontWeight: fontWeights.semibold,
    letterSpacing: 0,
  },

  // Body
  bodyLarge: {
    fontFamily,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    fontWeight: fontWeights.regular,
    letterSpacing: 0.15,
  },
  bodyMedium: {
    fontFamily,
    fontSize: fontSizes.body,
    lineHeight: lineHeights.body,
    fontWeight: fontWeights.regular,
    letterSpacing: 0.1,
  },
  bodySmall: {
    fontFamily,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: fontWeights.regular,
    letterSpacing: 0.1,
  },

  // Labels
  labelLarge: {
    fontFamily,
    fontSize: fontSizes.body,
    lineHeight: lineHeights.body,
    fontWeight: fontWeights.medium,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontFamily,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: fontWeights.medium,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontFamily,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontWeight: fontWeights.medium,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Special
  caption: {
    fontFamily,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontWeight: fontWeights.regular,
    letterSpacing: 0.4,
  },
  overline: {
    fontFamily,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontWeight: fontWeights.semibold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  mono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: fontSizes.body,
    lineHeight: lineHeights.body,
    fontWeight: fontWeights.regular,
  },
};
