import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { getDataMode } from '@/data/supabase-client';
import { barbers as localBarbers, studios as localStudios } from '@/domain/catalog';
import { BarberCard } from '@/components/barber-card';
import { useAppStore } from '@/state/app-store';

export default function HomeScreen() {
  const router = useRouter();
  const { barbers, studios, catalogLoading, catalogError, refreshCatalog } = useAppStore();
  const live = getDataMode() === 'supabase';
  const visibleBarbers = live ? barbers : localBarbers;
  const visibleStudios = live ? studios : localStudios;
  return <SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.container}><Text style={styles.eyebrow}>Fade Society</Text><Text style={styles.title}>Book your next cut.</Text><Text style={styles.subtitle}>Choose a barber to open their profile and start booking.</Text><Pressable accessibilityRole="button" accessibilityLabel="Open Find" onPress={() => router.push('/find')} style={styles.exploreButton}><Text style={styles.exploreText}>Browse all barbers</Text></Pressable>{catalogLoading ? <Text style={styles.subtitle}>Loading barbers...</Text> : catalogError ? <View><Text accessibilityRole="alert" style={styles.subtitle}>Barbers could not be loaded</Text><Pressable accessibilityRole="button" onPress={() => void refreshCatalog()}><Text style={styles.bookText}>Try again</Text></Pressable></View> : visibleBarbers.length === 0 ? <Text style={styles.subtitle}>No barbers are available right now.</Text> : <View style={styles.list}>{visibleBarbers.map((barber) => <BarberCard key={barber.id} barber={barber} studio={visibleStudios.find((item) => item.id === barber.studioId)} onPress={() => router.push({ pathname: '/book', params: { barberId: barber.id } })} />)}</View>}</ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ safeArea: { flex: 1, backgroundColor: '#F5F0EA' }, container: { padding: 20, paddingTop: 4, paddingBottom: 110 }, eyebrow: { color: '#8A6A3A', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginTop: 0 }, title: { color: '#171717', fontSize: 34, fontWeight: '800', marginTop: 4 }, subtitle: { color: '#736C62', fontSize: 16, lineHeight: 23, marginTop: 2 }, exploreButton: { minHeight: 48, marginTop: 8, borderRadius: 12, backgroundColor: '#171717', alignItems: 'center', justifyContent: 'center' }, exploreText: { color: '#FFF', fontWeight: '800' }, list: { gap: 10, marginTop: 8 }, bookText: { color: '#8A6A3A', fontWeight: '800' } });
