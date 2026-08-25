import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatBookingDate } from '@/domain/date';
import { useAppStore } from '@/state/app-store';
import { getDataMode } from '@/data/supabase-client';

export default function ConfirmationScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { bookings, hydrated, bookingLoading, bookingError, getBooking } = useAppStore();
  const [loadedBooking, setLoadedBooking] = React.useState<typeof bookings[number] | null>(null);
  const [lookupLoading, setLookupLoading] = React.useState(false);
  const [lookupError, setLookupError] = React.useState<string | null>(null);
  const booking = bookings.find((item) => item.id === id) ?? loadedBooking;

  React.useEffect(() => {
    if (!id || !hydrated || bookingLoading || booking || getDataMode() !== 'supabase') return;
    let active = true;
    void Promise.resolve().then(() => {
      if (active) setLookupLoading(true);
      return getBooking(id);
    }).then((nextBooking) => {
      if (active) setLoadedBooking(nextBooking);
    }).catch((error: unknown) => {
      if (active) setLookupError(error instanceof Error ? error.message : String(error));
    }).finally(() => {
      if (active) setLookupLoading(false);
    });
    return () => { active = false; };
  }, [booking, bookingLoading, getBooking, hydrated, id]);

  if (!hydrated || bookingLoading || lookupLoading) {
    return <SafeAreaView style={styles.safeArea}><View style={styles.container}><Text style={styles.title}>Loading booking...</Text></View></SafeAreaView>;
  }

  if (!booking) {
    return <SafeAreaView style={styles.safeArea}><View style={styles.container}><Text accessibilityRole="alert" style={styles.title}>{bookingError || lookupError ? 'Booking could not be loaded' : 'Booking not found'}</Text><Text style={styles.detail}>{bookingError ?? lookupError ?? 'This booking is no longer available.'}</Text><Pressable accessibilityRole="button" onPress={() => router.replace('/explore')} style={styles.primary}><Text style={styles.primaryText}>Find a barber</Text></Pressable></View></SafeAreaView>;
  }

  return <SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.container}>
    <View accessibilityRole="summary" style={styles.success}><Text accessibilityLabel="Success" style={styles.check}>✓</Text><Text style={styles.successTitle}>Request sent</Text><Text style={styles.successCopy}>Your appointment request is saved. The studio will confirm availability before it becomes final.</Text></View>
    <View accessibilityLabel={`Booking confirmation ${booking.confirmationCode}`} style={styles.card}><Text style={styles.label}>Confirmation</Text><Text style={styles.code}>{booking.confirmationCode}</Text><Text style={styles.service}>{booking.serviceName}</Text><Text style={styles.detail}>{booking.barberName} • {booking.studioName}</Text><Text style={styles.detail}>{formatBookingDate(booking.startsAt)}</Text><Text style={styles.detail}>{booking.studioName}</Text><Text style={styles.detail}>Price: ${booking.price}</Text><Text style={styles.policy}>Cancellation policy: {booking.cancellationPolicy}</Text></View>
    <View style={styles.actions}><Pressable accessibilityRole="button" accessibilityLabel="View my bookings" accessibilityHint="Opens your bookings" onPress={() => router.replace('/bookings')} style={styles.primary}><Text style={styles.primaryText}>View my bookings</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Contact studio" accessibilityHint="Opens messages" onPress={() => router.replace('/messages')} style={styles.secondary}><Text style={styles.secondaryText}>Contact studio</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Find another barber" accessibilityHint="Opens barber search" onPress={() => router.replace('/explore')} style={styles.secondary}><Text style={styles.secondaryText}>Find another barber</Text></Pressable></View>
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ safeArea: { flex: 1, backgroundColor: '#F5F0EA' }, container: { padding: 18, paddingBottom: 48 }, success: { backgroundColor: '#171717', borderRadius: 20, padding: 22, alignItems: 'center', marginTop: 18 }, check: { color: '#D9B778', fontSize: 38, fontWeight: '800' }, successTitle: { color: '#FFF', fontSize: 23, fontWeight: '800', marginTop: 8 }, successCopy: { color: '#E7DED4', textAlign: 'center', lineHeight: 20, marginTop: 8 }, title: { color: '#171717', fontSize: 28, fontWeight: '800' }, card: { backgroundColor: '#FFF', borderRadius: 18, padding: 18, marginTop: 16, borderWidth: 1, borderColor: '#E9DED0' }, label: { color: '#736C62', textTransform: 'uppercase', fontSize: 11, fontWeight: '800' }, code: { color: '#8A6A3A', fontSize: 22, fontWeight: '800', marginTop: 4, marginBottom: 18 }, service: { color: '#171717', fontSize: 19, fontWeight: '800' }, detail: { color: '#736C62', marginTop: 8 }, policy: { color: '#8C4A1D', backgroundColor: '#FCE7D5', borderRadius: 10, padding: 10, marginTop: 16 }, actions: { gap: 10, marginTop: 18 }, primary: { minHeight: 48, borderRadius: 12, backgroundColor: '#171717', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }, primaryText: { color: '#FFF', fontWeight: '800' }, secondary: { minHeight: 48, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0D6C9', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }, secondaryText: { color: '#171717', fontWeight: '800' } });
