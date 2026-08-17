import { Link, Slot, usePathname } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';

const tabs = [
  { href: '/', label: 'Home' },
  { href: '/find', label: 'Explore' },
  { href: '/bookings', label: 'Bookings' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/messages', label: 'Messages' },
  { href: '/profile', label: 'Profile' },
  { href: '/settings', label: 'Settings' },
] as const;

// Web has no native tab bar, so this renders any matched route via Slot
// instead of a separate isolated tab navigator that could swallow pushes.
export default function AppTabs() {
  const pathname = usePathname();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <Slot />
      </View>
      <SafeAreaView edges={['bottom']} style={[styles.tabBar, { backgroundColor: colors.background, borderTopColor: colors.backgroundElement }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
          {tabs.map((tab) => {
            const active = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
            return (
              <Link key={tab.href} href={tab.href} asChild>
                <Pressable accessibilityRole="button" accessibilityLabel={tab.label} accessibilityState={{ selected: active }} style={styles.tabButton}>
                  <Text style={[styles.tabText, active && { color: colors.text, fontWeight: '800' }]}>{tab.label}</Text>
                </Pressable>
              </Link>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles: any = StyleSheet.create({
  root: { flex: 1, minHeight: '100vh' as any, position: 'relative' },
  content: { flex: 1, minHeight: 0, paddingBottom: 72 },
  tabBar: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopWidth: 1 },
  tabRow: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  tabButton: { minHeight: 44, paddingHorizontal: 14, justifyContent: 'center' },
  tabText: { color: '#736C62', fontWeight: '700' },
});
