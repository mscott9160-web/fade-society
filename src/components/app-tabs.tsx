import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { customerTabs } from './customer-tabs';

export default function AppTabs() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#171717', tabBarInactiveTintColor: '#736C62' }}>
      {customerTabs.map((tab) => <Tabs.Screen key={tab.href} name={tab.href === '/' ? 'index' : tab.href.slice(1)} options={{ title: tab.label, tabBarIcon: ({ color, size }) => <Ionicons name={tab.href === '/' ? 'home-outline' : tab.href === '/find' ? 'search-outline' : tab.href === '/bookings' ? 'calendar-outline' : tab.href === '/messages' ? 'chatbubble-outline' : 'person-outline'} color={color} size={size} /> }} />)}
      <Tabs.Screen name="calendar" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="book" options={{ href: null }} />
      <Tabs.Screen name="confirmation/[id]" options={{ href: null }} />
      <Tabs.Screen name="messages/[id]" options={{ href: null }} />
    </Tabs>
  );
}
