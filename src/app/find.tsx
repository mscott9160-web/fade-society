import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

const barbers = [
  { id: 'marcus-j', name: 'Marcus J.', studio: 'Northline Studio', specialty: 'Premium fades', rating: '4.9' },
  { id: 'andre-m', name: 'Andre M.', studio: 'The Blade Room', specialty: 'Beard sculpting', rating: '4.8' },
  { id: 'jamal-r', name: 'Jamal R.', studio: 'Crown & Co.', specialty: 'Modern taper', rating: '5.0' },
];

export default function FindScreen() {
  const router = useRouter();
  return <SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.container}><Text style={styles.title}>Find a barber</Text><Text style={styles.subtitle}>Tap any barber to open the booking flow.</Text><View style={styles.list}>{barbers.map((barber) => <Pressable key={barber.id} accessibilityRole="button" accessibilityLabel={`Open ${barber.name} profile at ${barber.studio}`} onPress={() => router.push({ pathname: '/book', params: { barberId: barber.id } })} style={styles.barberButton}><View><Text style={styles.barberName}>{barber.name}</Text><Text style={styles.barberMeta}>{barber.studio}</Text><Text style={styles.barberDetail}>{barber.specialty} • {barber.rating} stars</Text></View><Text style={styles.bookText}>View & book</Text></Pressable>)}</View></ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ safeArea: { flex: 1, backgroundColor: '#F5F0EA' }, container: { padding: 20, paddingTop: 4, paddingBottom: 110 }, title: { color: '#171717', fontSize: 32, fontWeight: '800', marginTop: 0 }, subtitle: { color: '#736C62', marginTop: 2, fontSize: 15 }, list: { gap: 10, marginTop: 8 }, barberButton: { minHeight: 84, borderRadius: 14, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E9DED0', padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, barberName: { color: '#171717', fontSize: 17, fontWeight: '800' }, barberMeta: { color: '#736C62', marginTop: 4 }, barberDetail: { color: '#736C62', marginTop: 4, fontSize: 12 }, bookText: { color: '#8A6A3A', fontWeight: '800' } });
