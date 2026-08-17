import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

const barbers = [
  { id: 'marcus-j', name: 'Marcus J.', studio: 'Northline Studio', specialty: 'Premium fades' },
  { id: 'andre-m', name: 'Andre M.', studio: 'The Blade Room', specialty: 'Beard sculpting' },
  { id: 'jamal-r', name: 'Jamal R.', studio: 'Crown & Co.', specialty: 'Modern taper' },
];

export default function HomeScreen() {
  const router = useRouter();
  return <SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.container}><Text style={styles.eyebrow}>Fade Society</Text><Text style={styles.title}>Book your next cut.</Text><Text style={styles.subtitle}>Choose a barber to open their profile and start booking.</Text><Pressable accessibilityRole="button" accessibilityLabel="Open Explore" onPress={() => router.push('/find')} style={styles.exploreButton}><Text style={styles.exploreText}>Browse all barbers</Text></Pressable><View style={styles.list}>{barbers.map((barber) => <Pressable key={barber.id} accessibilityRole="button" accessibilityLabel={`Book ${barber.name} at ${barber.studio}`} onPress={() => router.push({ pathname: '/book', params: { barberId: barber.id } })} style={styles.barberButton}><View><Text style={styles.barberName}>{barber.name}</Text><Text style={styles.barberMeta}>{barber.studio} • {barber.specialty}</Text></View><Text style={styles.bookText}>Book</Text></Pressable>)}</View></ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ safeArea: { flex: 1, backgroundColor: '#F5F0EA' }, container: { padding: 20, paddingTop: 4, paddingBottom: 110 }, eyebrow: { color: '#8A6A3A', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginTop: 0 }, title: { color: '#171717', fontSize: 34, fontWeight: '800', marginTop: 4 }, subtitle: { color: '#736C62', fontSize: 16, lineHeight: 23, marginTop: 2 }, exploreButton: { minHeight: 48, marginTop: 8, borderRadius: 12, backgroundColor: '#171717', alignItems: 'center', justifyContent: 'center' }, exploreText: { color: '#FFF', fontWeight: '800' }, list: { gap: 10, marginTop: 8 }, barberButton: { minHeight: 72, borderRadius: 14, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E9DED0', padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, barberName: { color: '#171717', fontSize: 17, fontWeight: '800' }, barberMeta: { color: '#736C62', marginTop: 5 }, bookText: { color: '#8A6A3A', fontWeight: '800' } });
