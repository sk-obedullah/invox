/**
 * Invox Color System
 * Curated palette inspired by modern fintech apps
 */

export const palette = {
  // Primary - Deep Indigo
  primary50: '#EEF2FF',
  primary100: '#E0E7FF',
  primary200: '#C7D2FE',
  primary300: '#A5B4FC',
  primary400: '#818CF8',
  primary500: '#6366F1',
  primary600: '#4F46E5',
  primary700: '#4338CA',
  primary800: '#3730A3',
  primary900: '#312E81',

  // Accent - Teal
  accent50: '#F0FDFA',
  accent100: '#CCFBF1',
  accent200: '#99F6E4',
  accent300: '#5EEAD4',
  accent400: '#2DD4BF',
  accent500: '#14B8A6',
  accent600: '#0D9488',
  accent700: '#0F766E',

  // Success - Emerald
  success50: '#ECFDF5',
  success500: '#10B981',
  success600: '#059669',
  success700: '#047857',

  // Warning - Amber
  warning50: '#FFFBEB',
  warning500: '#F59E0B',
  warning600: '#D97706',

  // Error - Rose
  error50: '#FFF1F2',
  error500: '#F43F5E',
  error600: '#E11D48',

  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  gray950: '#0B0F19',
};

export const lightColors = {
  // Surfaces
  background: '#F8FAFC',
  surface: palette.white,
  surfaceVariant: palette.gray50,
  card: palette.white,
  
  // Text
  textPrimary: palette.gray900,
  textSecondary: palette.gray600,
  textTertiary: palette.gray400,
  textInverse: palette.white,
  
  // Brand
  primary: palette.primary600,
  primaryLight: palette.primary100,
  primaryDark: palette.primary800,
  accent: palette.accent500,
  accentLight: palette.accent100,
  
  // Semantic
  success: palette.success500,
  successLight: palette.success50,
  warning: palette.warning500,
  warningLight: palette.warning50,
  error: palette.error500,
  errorLight: palette.error50,
  
  // UI
  border: palette.gray200,
  borderLight: palette.gray100,
  divider: palette.gray100,
  placeholder: palette.gray400,
  disabled: palette.gray300,
  ripple: 'rgba(99, 102, 241, 0.12)',
  shadow: 'rgba(0, 0, 0, 0.08)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Status
  statusDraft: palette.gray500,
  statusSent: palette.primary500,
  statusPaid: palette.success500,
  statusOverdue: palette.error500,
  statusCancelled: palette.warning500,
};

export const darkColors = {
  // Surfaces
  background: '#0F1117',
  surface: '#1A1D27',
  surfaceVariant: '#242736',
  card: '#1A1D27',
  
  // Text
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  textInverse: palette.gray900,
  
  // Brand
  primary: palette.primary400,
  primaryLight: 'rgba(99, 102, 241, 0.15)',
  primaryDark: palette.primary300,
  accent: palette.accent400,
  accentLight: 'rgba(20, 184, 166, 0.15)',
  
  // Semantic
  success: palette.success500,
  successLight: 'rgba(16, 185, 129, 0.15)',
  warning: palette.warning500,
  warningLight: 'rgba(245, 158, 11, 0.15)',
  error: palette.error500,
  errorLight: 'rgba(244, 63, 94, 0.15)',
  
  // UI
  border: '#2D3148',
  borderLight: '#242736',
  divider: '#242736',
  placeholder: '#64748B',
  disabled: '#374151',
  ripple: 'rgba(129, 140, 248, 0.15)',
  shadow: 'rgba(0, 0, 0, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  
  // Status
  statusDraft: palette.gray400,
  statusSent: palette.primary400,
  statusPaid: palette.success500,
  statusOverdue: palette.error500,
  statusCancelled: palette.warning500,
};
