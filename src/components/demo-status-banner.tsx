import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppStore } from '@/state/app-store';

export default function DemoStatusBanner() {
  const { persistenceError, clearPersistenceError } = useAppStore();
  if (!persistenceError) return null;
  return <View accessibilityRole="alert" style={styles.banner}><View style={styles.copy}><Text style={styles.title}>Local demo data notice</Text><Text style={styles.message}>{persistenceError}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Dismiss data notice" onPress={clearPersistenceError} style={styles.dismiss}><Text style={styles.dismissText}>Dismiss</Text></Pressable></View>;
}

const styles = StyleSheet.create({ banner: { marginHorizontal: 14, marginTop: 8, padding: 12, borderRadius: 12, backgroundColor: '#FCE7D5', flexDirection: 'row', alignItems: 'center' }, copy: { flex: 1, paddingRight: 10 }, title: { color: '#8C4A1D', fontWeight: '800' }, message: { color: '#8C4A1D', fontSize: 12, marginTop: 3 }, dismiss: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 8 }, dismissText: { color: '#8C4A1D', fontWeight: '800' } });
