import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '@/state/app-store';
import { getDataMode } from '@/data/supabase-client';
import { useCustomerTheme } from '@/hooks/use-customer-theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { bookings, currentUser, resetDemoData, role, barbers, studios } = useAppStore();
  const theme = useCustomerTheme();
  const localMode = getDataMode() === 'local';
  const providerMode = role !== 'customer';
  const confirmed = bookings.filter((booking) => booking.status !== 'cancelled').length;
  const name = currentUser?.displayName || (localMode ? 'Demo customer' : 'Customer');
  const providerBarber = currentUser ? barbers.find((barber) => barber.id === currentUser.id) : undefined;
  const studioId = providerBarber?.studioId ?? bookings[0]?.studioId;
  const studio = studioId ? studios.find((item) => item.id === studioId) : undefined;
  const today = new Date();
  const isToday = (value: string) => { const date = new Date(value); return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate(); };
  const pending = bookings.filter((booking) => booking.status === 'pending').length;
  const todayCount = bookings.filter((booking) => isToday(booking.startsAt) && booking.status !== 'cancelled').length;
  const upcoming = bookings.filter((booking) => new Date(booking.startsAt) > today && ['pending', 'confirmed'].includes(booking.status)).length;
  const completed = bookings.filter((booking) => booking.status === 'completed').length;

  return <SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.container}>
    <Text style={[styles.title, { color: theme.text, fontSize: 32 * theme.textScale }]}>Profile</Text>
    <View style={[styles.profileCard, { backgroundColor: theme.inverseSurface }]}><View style={styles.avatar} /><Text style={styles.name}>{name}</Text>{providerMode ? <><Text style={styles.handle}>{role[0].toUpperCase() + role.slice(1)}</Text>{studio && <Text style={styles.handle}>{studio.name}</Text>}</> : localMode && <Text style={styles.handle}>Local demo mode</Text>}<Text style={styles.bio}>{providerMode ? 'Your provider profile and studio workspace.' : 'Manage your account and upcoming appointments.'}</Text></View>
    {providerMode ? <>
      <View style={styles.stats}>{[['Pending', pending], ['Today', todayCount], ['Upcoming', upcoming], ['Completed', completed]].map(([label, value]) => <View key={label as string} style={[styles.stat, { backgroundColor: theme.surface }]}><Text style={[styles.value, { color: theme.text, fontSize: 20 * theme.textScale }]}>{value}</Text><Text style={[styles.label, { color: theme.secondaryText }]}>{label}</Text></View>)}</View>
      <View style={[styles.card, { backgroundColor: theme.surface }]}><Text style={[styles.cardTitle, { color: theme.text }]}>Provider workspace</Text><Text style={[styles.cardText, { color: theme.secondaryText }]}>{studio ? `Appointments and availability for ${studio.name}.` : 'Appointments and availability for your provider account.'}</Text></View>
      <View style={styles.actions}>{[['Today', '/today', 'Review requests and appointments'], ['Messages', '/messages', 'Open provider conversations'], ['Availability', '/availability', 'Manage appointment slots'], ['Settings', '/settings', 'Change account preferences']].map(([label, path, hint]) => <Pressable key={path} accessibilityRole="button" accessibilityLabel={`Open ${label}`} accessibilityHint={hint} onPress={() => router.push(path as '/today')} style={[styles.action, { backgroundColor: theme.surface, borderColor: theme.border }]}><Text style={[styles.actionText, { color: theme.text }]}>{label}</Text></Pressable>)}</View>
    </> : <>
      <View style={styles.stats}><View style={[styles.stat, { backgroundColor: theme.surface }]}><Text style={[styles.value, { color: theme.text, fontSize: 20 * theme.textScale }]}>{confirmed}</Text><Text style={[styles.label, { color: theme.secondaryText }]}>Bookings</Text></View></View>
      <View style={[styles.card, { backgroundColor: theme.surface }]}><Text style={[styles.cardTitle, { color: theme.text }]}>Booking summary</Text><Text style={[styles.cardText, { color: theme.secondaryText }]}>{confirmed === 0 ? 'No upcoming or past bookings yet.' : `${confirmed} booking${confirmed === 1 ? '' : 's'} on your account.`}</Text></View>
    </>}
    <Pressable accessibilityRole="button" accessibilityLabel="Open settings" accessibilityHint="Change appearance and accessibility preferences" onPress={() => router.push('/settings')} style={styles.primary}><Text style={styles.primaryText}>Settings</Text></Pressable>
    {localMode && <Pressable accessibilityRole="button" accessibilityLabel="Reset demo data" onPress={resetDemoData} style={styles.reset}><Text style={styles.resetText}>Reset demo data</Text></Pressable>}
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ safeArea: { flex: 1, backgroundColor: '#F5F0EA' }, container: { padding: 18, paddingBottom: 48 }, title: { color: '#171717', fontSize: 32, fontWeight: '800', marginTop: 12 }, profileCard: { backgroundColor: '#171717', borderRadius: 22, padding: 22, alignItems: 'center', marginTop: 18 }, avatar: { width: 82, height: 82, borderRadius: 41, backgroundColor: '#D9B778', marginBottom: 12 }, name: { color: '#FFF', fontSize: 23, fontWeight: '800' }, handle: { color: '#D0C8C2', marginTop: 4 }, bio: { color: '#F1EDE8', textAlign: 'center', lineHeight: 20, marginTop: 10 }, stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 }, stat: { flex: 1, minWidth: '22%', backgroundColor: '#FFF', borderRadius: 14, padding: 14 }, value: { color: '#171717', fontWeight: '800', fontSize: 20 }, label: { color: '#736C62', marginTop: 4, fontSize: 12 }, card: { backgroundColor: '#FFF', borderRadius: 18, padding: 18, marginTop: 16 }, cardTitle: { color: '#171717', fontSize: 17, fontWeight: '800', marginBottom: 10 }, cardText: { color: '#736C62', marginTop: 7 }, actions: { gap: 10, marginTop: 16 }, action: { minHeight: 48, borderRadius: 12, borderWidth: 1, justifyContent: 'center', paddingHorizontal: 16 }, actionText: { fontWeight: '800' }, primary: { minHeight: 48, marginTop: 16, borderRadius: 12, backgroundColor: '#171717', alignItems: 'center', justifyContent: 'center' }, primaryText: { color: '#FFF', fontWeight: '800' }, reset: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 10 }, resetText: { color: '#8A6A3A', fontWeight: '800' } });
