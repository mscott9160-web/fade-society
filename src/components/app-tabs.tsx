import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { customerTabs } from './customer-tabs';
import { useCustomerTheme } from '@/hooks/use-customer-theme';
import { useAppStore } from '@/state/app-store';

export default function AppTabs() {
  const theme = useCustomerTheme();
  const { role } = useAppStore();
  const providerMode = role === 'barber' || role === 'owner' || role === 'admin';
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: theme.text, tabBarInactiveTintColor: theme.secondaryText, tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.border } }}>
      <Tabs.Screen name="today" options={{ href: providerMode ? '/today' : null, title: 'Today', tabBarIcon: ({ color, size }) => <Ionicons name="briefcase-outline" color={color} size={size} /> }} />
      {customerTabs.map((tab) => <Tabs.Screen key={tab.href} name={tab.href === '/' ? 'index' : tab.href.slice(1)} options={{ title: tab.label, tabBarIcon: ({ color, size }) => <Ionicons name={tab.href === '/' ? 'home-outline' : tab.href === '/find' ? 'search-outline' : tab.href === '/bookings' ? 'calendar-outline' : tab.href === '/messages' ? 'chatbubble-outline' : 'person-outline'} color={color} size={size} /> }} />)}
      <Tabs.Screen name="calendar" options={{ href: null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="book" options={{ href: null }} />
      <Tabs.Screen name="confirmation/[id]" options={{ href: null }} />
      <Tabs.Screen name="messages/[id]" options={{ href: null }} />
    </Tabs>
  );
}
