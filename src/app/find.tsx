import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { getDataMode } from '@/data/supabase-client';
import { barbers as localBarbers, studios as localStudios } from '@/domain/catalog';
import { useAppStore } from '@/state/app-store';
import { BarberCard } from '@/components/barber-card';

export default function FindScreen() {
  const router = useRouter();
  const { barbers, studios, catalogLoading, catalogError, refreshCatalog } = useAppStore();
  const live = getDataMode() === 'supabase';
  const visibleBarbers = live ? barbers : localBarbers;
  const visibleStudios = live ? studios : localStudios;
  if (catalogLoading) return <SafeAreaView style={styles.safeArea}><View style={styles.empty}><Text style={styles.title}>Loading barbers...</Text></View></SafeAreaView>;
  if (catalogError) return <SafeAreaView style={styles.safeArea}><View style={styles.empty}><Text accessibilityRole="alert" style={styles.title}>Barbers could not be loaded</Text><Text style={styles.subtitle}>{catalogError}</Text><Pressable accessibilityRole="button" onPress={() => void refreshCatalog()} style={styles.barberButton}><Text style={styles.bookText}>Try again</Text></Pressable></View></SafeAreaView>;
  return <SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.container}><Text style={styles.title}>Find a barber</Text><Text style={styles.subtitle}>Tap any barber to open the booking flow.</Text>{visibleBarbers.length === 0 ? <Text style={styles.subtitle}>No barbers are available right now.</Text> : <View style={styles.list}>{visibleBarbers.map((barber) => <BarberCard key={barber.id} barber={barber} studio={visibleStudios.find((item) => item.id === barber.studioId)} onPress={() => router.push({ pathname: '/book', params: { barberId: barber.id } })} />)}</View>}</ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ safeArea: { flex: 1, backgroundColor: '#F5F0EA' }, container: { padding: 20, paddingTop: 4, paddingBottom: 110 }, empty: { padding: 20 }, title: { color: '#171717', fontSize: 32, fontWeight: '800', marginTop: 0 }, subtitle: { color: '#736C62', marginTop: 2, fontSize: 15 }, list: { gap: 10, marginTop: 8 }, barberButton: { minHeight: 84, borderRadius: 14, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E9DED0', padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, barberName: { color: '#171717', fontSize: 17, fontWeight: '800' }, barberMeta: { color: '#736C62', marginTop: 4 }, barberDetail: { color: '#736C62', marginTop: 4, fontSize: 12 }, bookText: { color: '#8A6A3A', fontWeight: '800' } });
