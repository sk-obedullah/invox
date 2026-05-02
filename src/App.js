/**
 * Invox - Main App Entry Point
 */
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useAppTheme } from './theme';
import { useAppStore } from './store/useAppStore';
import AppNavigator from './presentation/navigation/AppNavigator';
import ErrorBoundary from './presentation/components/common/ErrorBoundary';

const AppContent = () => {
  const theme = useAppTheme();
  const { colors } = theme.custom;
  const { isInitialized, isInitializing, initError, initialize } = useAppStore();

  useEffect(() => {
    initialize();
  }, []);

  if (isInitializing) {
    return (
      <View style={[styles.splash, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <Text style={[styles.splashTitle, { color: colors.primary }]}>Invox</Text>
        <Text style={[styles.splashSub, { color: colors.textSecondary }]}>Professional Invoicing</Text>
        <ActivityIndicator size="large" color={colors.primary} style={styles.splashLoader} />
      </View>
    );
  }

  if (initError) {
    return (
      <View style={[styles.splash, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorTitle, { color: colors.error }]}>Initialization Failed</Text>
        <Text style={[styles.errorMsg, { color: colors.textSecondary }]}>{initError}</Text>
      </View>
    );
  }

  return (
    <NavigationContainer theme={{
        dark: theme.dark,
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.textPrimary,
          border: colors.border,
          notification: colors.error,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '800' },
        },
      }}>
        <AppNavigator />
      </NavigationContainer>
  );
};

const App = () => {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  splash: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  splashTitle: { fontSize: 36, fontWeight: '800', letterSpacing: -1 },
  splashSub: { fontSize: 14, marginTop: 4 },
  splashLoader: { marginTop: 24 },
  errorTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  errorMsg: { fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
});

export default App;
