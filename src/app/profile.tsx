import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '@/state/app-store';

export default function ProfileScreen() {
  const router = useRouter();
  const { bookings, resetDemoData } = useAppStore();
  const confirmed = bookings.filter((booking) => booking.status !== 'cancelled').length;

  return <SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.container}>
    <Text style={styles.title}>Profile</Text>
    <View style={styles.profileCard}><View style={styles.avatar} /><Text style={styles.name}>Darius Cole</Text><Text style={styles.handle}>@dariusfade</Text><Text style={styles.bio}>Your barber history, saved styles, and upcoming appointments.</Text></View>
    <View style={styles.stats}><View style={styles.stat}><Text style={styles.value}>{confirmed}</Text><Text style={styles.label}>Bookings</Text></View><View style={styles.stat}><Text style={styles.value}>12</Text><Text style={styles.label}>Saved</Text></View><View style={styles.stat}><Text style={styles.value}>4.9</Text><Text style={styles.label}>Reviews</Text></View></View>
    <View style={styles.card}><Text style={styles.cardTitle}>Your preferences</Text><Text style={styles.cardText}>Favorite studio: Northline Studio</Text><Text style={styles.cardText}>Preferred service: Classic fades</Text><Text style={styles.cardText}>Notifications: Enabled</Text></View>
    <Pressable accessibilityRole="button" accessibilityLabel="Open settings" accessibilityHint="Change appearance and accessibility preferences" onPress={() => router.push('/settings')} style={styles.primary}><Text style={styles.primaryText}>Settings</Text></Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Reset demo data" onPress={resetDemoData} style={styles.reset}><Text style={styles.resetText}>Reset demo data</Text></Pressable>
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ safeArea: { flex: 1, backgroundColor: '#F5F0EA' }, container: { padding: 18, paddingBottom: 48 }, title: { color: '#171717', fontSize: 32, fontWeight: '800', marginTop: 12 }, profileCard: { backgroundColor: '#171717', borderRadius: 22, padding: 22, alignItems: 'center', marginTop: 18 }, avatar: { width: 82, height: 82, borderRadius: 41, backgroundColor: '#D9B778', marginBottom: 12 }, name: { color: '#FFF', fontSize: 23, fontWeight: '800' }, handle: { color: '#D0C8C2', marginTop: 4 }, bio: { color: '#F1EDE8', textAlign: 'center', lineHeight: 20, marginTop: 10 }, stats: { flexDirection: 'row', gap: 10, marginTop: 16 }, stat: { flex: 1, backgroundColor: '#FFF', borderRadius: 14, padding: 14 }, value: { color: '#171717', fontWeight: '800', fontSize: 20 }, label: { color: '#736C62', marginTop: 4, fontSize: 12 }, card: { backgroundColor: '#FFF', borderRadius: 18, padding: 18, marginTop: 16 }, cardTitle: { color: '#171717', fontSize: 17, fontWeight: '800', marginBottom: 10 }, cardText: { color: '#736C62', marginTop: 7 }, primary: { minHeight: 48, marginTop: 16, borderRadius: 12, backgroundColor: '#171717', alignItems: 'center', justifyContent: 'center' }, primaryText: { color: '#FFF', fontWeight: '800' }, reset: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 10 }, resetText: { color: '#8A6A3A', fontWeight: '800' } });
