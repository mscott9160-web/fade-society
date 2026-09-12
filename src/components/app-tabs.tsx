import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { customerTabs } from './customer-tabs';
import { useCustomerTheme } from '@/hooks/use-customer-theme';
import { useAppStore } from '@/state/app-store';

export default function AppTabs() {
  const theme = useCustomerTheme();
  const { role } = useAppStore();
  const providerMode = role === 'barber' || role === 'owner' || role === 'admin';
  const visibleTabs = providerMode
    ? [{ href: '/today' as const, label: 'Today', icon: 'briefcase-outline' as const }, { href: '/profile' as const, label: 'Profile', icon: 'person-outline' as const }]
    : customerTabs.map((tab) => ({ ...tab, icon: tab.href === '/' ? 'home-outline' as const : tab.href === '/find' ? 'search-outline' as const : tab.href === '/bookings' ? 'calendar-outline' as const : tab.href === '/messages' ? 'chatbubble-outline' as const : 'person-outline' as const }));
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: theme.text, tabBarInactiveTintColor: theme.secondaryText, tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.border } }}>
      {visibleTabs.map((tab) => <Tabs.Screen key={tab.href} name={tab.href === '/' ? 'index' : tab.href.slice(1)} options={{ title: tab.label, href: tab.href, tabBarIcon: ({ color, size }) => <Ionicons name={tab.icon} color={color} size={size} /> }} />)}
      <Tabs.Screen name="availability" options={{ href: null }} />
      {(['today', 'index', 'find', 'bookings', 'messages', 'profile'] as const).filter((name) => !visibleTabs.some((tab) => (tab.href === '/' ? 'index' : tab.href.slice(1)) === name)).map((name) => <Tabs.Screen key={name} name={name} options={{ href: null }} />)}
      <Tabs.Screen name="calendar" options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="book" options={{ href: null }} />
      <Tabs.Screen name="booking/[id]" options={{ href: null }} />
      <Tabs.Screen name="confirmation/[id]" options={{ href: null }} />
      <Tabs.Screen name="messages/[id]" options={{ href: null }} />
    </Tabs>
  );
}
