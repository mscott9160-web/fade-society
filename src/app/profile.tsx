import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '@/state/app-store';
import { getDataMode } from '@/data/supabase-client';
import { useCustomerTheme } from '@/hooks/use-customer-theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { bookings, currentUser, resetDemoData } = useAppStore();
  const theme = useCustomerTheme();
  const localMode = getDataMode() === 'local';
  const confirmed = bookings.filter((booking) => booking.status !== 'cancelled').length;
  const name = currentUser?.displayName || (localMode ? 'Demo customer' : 'Customer');

  return <SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.container}>
    <Text style={[styles.title, { color: theme.text, fontSize: 32 * theme.textScale }]}>Profile</Text>
    <View style={[styles.profileCard, { backgroundColor: theme.inverseSurface }]}><View style={styles.avatar} /><Text style={styles.name}>{name}</Text>{localMode && <Text style={styles.handle}>Local demo mode</Text>}<Text style={styles.bio}>Manage your account and upcoming appointments.</Text></View>
    <View style={styles.stats}><View style={[styles.stat, { backgroundColor: theme.surface }]}><Text style={[styles.value, { color: theme.text, fontSize: 20 * theme.textScale }]}>{confirmed}</Text><Text style={[styles.label, { color: theme.secondaryText }]}>Bookings</Text></View></View>
    <View style={[styles.card, { backgroundColor: theme.surface }]}><Text style={[styles.cardTitle, { color: theme.text }]}>Booking summary</Text><Text style={[styles.cardText, { color: theme.secondaryText }]}>{confirmed === 0 ? 'No upcoming or past bookings yet.' : `${confirmed} booking${confirmed === 1 ? '' : 's'} on your account.`}</Text></View>
    <Pressable accessibilityRole="button" accessibilityLabel="Open settings" accessibilityHint="Change appearance and accessibility preferences" onPress={() => router.push('/settings')} style={styles.primary}><Text style={styles.primaryText}>Settings</Text></Pressable>
    {localMode && <Pressable accessibilityRole="button" accessibilityLabel="Reset demo data" onPress={resetDemoData} style={styles.reset}><Text style={styles.resetText}>Reset demo data</Text></Pressable>}
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ safeArea: { flex: 1, backgroundColor: '#F5F0EA' }, container: { padding: 18, paddingBottom: 48 }, title: { color: '#171717', fontSize: 32, fontWeight: '800', marginTop: 12 }, profileCard: { backgroundColor: '#171717', borderRadius: 22, padding: 22, alignItems: 'center', marginTop: 18 }, avatar: { width: 82, height: 82, borderRadius: 41, backgroundColor: '#D9B778', marginBottom: 12 }, name: { color: '#FFF', fontSize: 23, fontWeight: '800' }, handle: { color: '#D0C8C2', marginTop: 4 }, bio: { color: '#F1EDE8', textAlign: 'center', lineHeight: 20, marginTop: 10 }, stats: { flexDirection: 'row', gap: 10, marginTop: 16 }, stat: { flex: 1, backgroundColor: '#FFF', borderRadius: 14, padding: 14 }, value: { color: '#171717', fontWeight: '800', fontSize: 20 }, label: { color: '#736C62', marginTop: 4, fontSize: 12 }, card: { backgroundColor: '#FFF', borderRadius: 18, padding: 18, marginTop: 16 }, cardTitle: { color: '#171717', fontSize: 17, fontWeight: '800', marginBottom: 10 }, cardText: { color: '#736C62', marginTop: 7 }, primary: { minHeight: 48, marginTop: 16, borderRadius: 12, backgroundColor: '#171717', alignItems: 'center', justifyContent: 'center' }, primaryText: { color: '#FFF', fontWeight: '800' }, reset: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 10 }, resetText: { color: '#8A6A3A', fontWeight: '800' } });
