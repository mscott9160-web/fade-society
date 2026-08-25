import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Barber, Studio } from '@/domain/models';

type BarberCardProps = {
  barber: Barber;
  studio?: Studio;
  onPress: () => void;
};

export function BarberCard({ barber, studio, onPress }: BarberCardProps) {
  const rating = barber.rating > 0 ? `${barber.rating} stars` : 'Rating unavailable';
  return <Pressable accessibilityRole="button" accessibilityLabel={`Open ${barber.name} profile at ${studio?.name ?? 'studio unavailable'}`} onPress={onPress} style={styles.card}>
    <View>
      <Text style={styles.name}>{barber.name}</Text>
      <Text style={styles.studio}>{studio?.name ?? 'Studio unavailable'}</Text>
      <Text style={styles.detail}>{barber.specialty} • {rating}</Text>
    </View>
    <Text style={styles.action}>View & book</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  card: { minHeight: 84, borderRadius: 14, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E9DED0', padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { color: '#171717', fontSize: 17, fontWeight: '800' },
  studio: { color: '#736C62', marginTop: 4 },
  detail: { color: '#736C62', marginTop: 4, fontSize: 12 },
  action: { color: '#8A6A3A', fontWeight: '800' },
});