import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { AppStoreProvider, useAppStore } from '@/state/app-store';
import DemoStatusBanner from '@/components/demo-status-banner';

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
  const { preferences } = useAppStore();
  return <ThemeProvider value={preferences.darkMode || colorScheme === 'dark' ? DarkTheme : DefaultTheme}><DemoStatusBanner /><AnimatedSplashOverlay /><AppTabs /></ThemeProvider>;
}
