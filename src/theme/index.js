/**
 * Invox Theme Provider
 * Manages light/dark mode - no Paper dependency
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors } from './colors';
import { typography } from './typography';
import { spacing, borderRadius, elevation } from './spacing';
import { useSettingsStore } from '../store/useSettingsStore';

const createTheme = (isDark) => {
  const colors = isDark ? darkColors : lightColors;

  return {
    dark: isDark,
    custom: {
      colors,
      spacing,
      borderRadius,
      elevation,
      typography,
    },
  };
};

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme();
  const themePreference = useSettingsStore((s) => s.theme);

  const isDark = useMemo(() => {
    if (themePreference === 'system') return systemScheme === 'dark';
    return themePreference === 'dark';
  }, [themePreference, systemScheme]);

  const theme = useMemo(() => createTheme(isDark), [isDark]);

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useAppTheme must be used within ThemeProvider');
  }
  return theme;
};

export { lightColors, darkColors };
