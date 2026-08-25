import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { AppStoreProvider, useAppStore } from '@/state/app-store';
import DemoStatusBanner from '@/components/demo-status-banner';
import AuthEntryScreen from '@/components/auth-entry-screen';
import { getDataMode } from '@/data/supabase-client';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <AppStoreProvider>
      <ThemedApp colorScheme={colorScheme} />
    </AppStoreProvider>
  );
}

function ThemedApp({ colorScheme }: { colorScheme: ReturnType<typeof useColorScheme> }) {
  const { preferences, authBootstrapState, authError, retryAuthBootstrap } = useAppStore();
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);
  const app = <ThemeProvider value={preferences.darkMode || colorScheme === 'dark' ? DarkTheme : DefaultTheme}><DemoStatusBanner /><AnimatedSplashOverlay /><AppTabs /></ThemeProvider>;
  if (getDataMode() === 'local') return app;
  if (authBootstrapState === 'loading') return <ThemeProvider value={DefaultTheme}><View style={styles.state}><ActivityIndicator accessibilityLabel="Loading account" size="large" color="#8A6A3A" /><Text style={styles.stateTitle}>Loading your account</Text></View></ThemeProvider>;
  if (authBootstrapState === 'error') return <ThemeProvider value={DefaultTheme}><View style={styles.state}><Text accessibilityRole="alert" style={styles.stateTitle}>We could not connect your account.</Text><Text style={styles.stateMessage}>{authError || 'Please try again.'}</Text><Pressable accessibilityRole="button" accessibilityLabel="Retry account connection" onPress={() => { void retryAuthBootstrap().catch(() => undefined); }} style={styles.retry}><Text style={styles.retryText}>Retry</Text></Pressable></View></ThemeProvider>;
  if (authBootstrapState === 'unauthenticated') return <ThemeProvider value={DefaultTheme}><AuthEntryScreen /></ThemeProvider>;
  return app;
}

const styles = StyleSheet.create({ state: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F5F0EA' }, stateTitle: { color: '#171717', fontSize: 22, fontWeight: '800', textAlign: 'center' }, stateMessage: { color: '#736C62', lineHeight: 22, marginTop: 8, maxWidth: 360, textAlign: 'center' }, retry: { minHeight: 48, minWidth: 140, marginTop: 20, borderRadius: 12, backgroundColor: '#171717', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }, retryText: { color: '#FFF', fontWeight: '800' } });
