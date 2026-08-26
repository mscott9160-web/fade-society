import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatBookingDate } from '@/domain/date';
import { useAppStore } from '@/state/app-store';
import { getDataMode } from '@/data/supabase-client';
import { useCustomerTheme } from '@/hooks/use-customer-theme';
import { presentBookingStatus } from '@/domain/booking-status';

export default function ConfirmationScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const theme = useCustomerTheme();
  const styles = createStyles(theme);
  const { bookings, hydrated, bookingLoading, bookingError, getBooking } = useAppStore();
  const [loadedBooking, setLoadedBooking] = React.useState<typeof bookings[number] | null>(null);
  const [lookupLoading, setLookupLoading] = React.useState(false);
  const [lookupError, setLookupError] = React.useState<string | null>(null);
  const booking = bookings.find((item) => item.id === id) ?? loadedBooking;
  const status = booking ? presentBookingStatus(booking.status) : null;

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
    return <SafeAreaView style={styles.safeArea}><View style={styles.container}><Text accessibilityRole="alert" style={styles.title}>{bookingError || lookupError ? 'Booking could not be loaded' : 'Booking not found'}</Text><Text style={styles.detail}>{bookingError ?? lookupError ?? 'This booking is no longer available.'}</Text><Pressable accessibilityRole="button" onPress={() => router.replace('/find')} style={styles.primary}><Text style={styles.primaryText}>Find a barber</Text></Pressable></View></SafeAreaView>;
  }

  return <SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.container}>
    <View accessibilityRole="summary" style={styles.success}><Text accessibilityLabel="Booking status" style={styles.check}>{status?.label}</Text><Text style={styles.successTitle}>{status?.label === 'Pending' ? 'Request received' : status?.label}</Text><Text style={styles.successCopy}>{status?.explanation}</Text></View>
    <View accessibilityLabel={`Booking reference ${booking.confirmationCode}`} style={styles.card}><Text style={styles.label}>Booking reference</Text><Text style={styles.code}>{booking.confirmationCode}</Text><Text style={styles.service}>{booking.serviceName}</Text><Text style={styles.detail}>{booking.barberName} / {booking.studioName}</Text><Text style={styles.detail}>{formatBookingDate(booking.startsAt)}</Text><Text style={styles.detail}>{booking.studioName}</Text><Text style={styles.detail}>Price: ${booking.price}</Text><Text style={styles.policy}>Cancellation policy: {booking.cancellationPolicy}</Text></View>
    <View style={styles.actions}><Pressable accessibilityRole="button" accessibilityLabel="View my bookings" accessibilityHint="Opens your bookings" onPress={() => router.replace('/bookings')} style={styles.primary}><Text style={styles.primaryText}>View my bookings</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Contact studio" accessibilityHint="Opens messages" onPress={() => router.replace('/messages')} style={styles.secondary}><Text style={styles.secondaryText}>Contact studio</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Find another barber" accessibilityHint="Opens barber search" onPress={() => router.replace('/find')} style={styles.secondary}><Text style={styles.secondaryText}>Find another barber</Text></Pressable></View>
  </ScrollView></SafeAreaView>;
}

function createStyles(theme: ReturnType<typeof useCustomerTheme>) {
  const scaled = (size: number) => size * theme.textScale;
  return StyleSheet.create({ safeArea: { flex: 1, backgroundColor: theme.background }, container: { padding: 18, paddingBottom: 48 }, success: { backgroundColor: theme.inverseSurface, borderRadius: 20, padding: 22, alignItems: 'center', marginTop: 18 }, check: { color: theme.accent, fontSize: scaled(38), fontWeight: '800' }, successTitle: { color: theme.inverseText, fontSize: scaled(23), fontWeight: '800', marginTop: 8 }, successCopy: { color: theme.secondaryText, textAlign: 'center', fontSize: scaled(14), lineHeight: scaled(20), marginTop: 8 }, title: { color: theme.text, fontSize: scaled(28), fontWeight: '800' }, card: { backgroundColor: theme.surface, borderRadius: 18, padding: 18, marginTop: 16, borderWidth: 1, borderColor: theme.border }, label: { color: theme.secondaryText, textTransform: 'uppercase', fontSize: scaled(11), fontWeight: '800' }, code: { color: theme.accent, fontSize: scaled(22), fontWeight: '800', marginTop: 4, marginBottom: 18 }, service: { color: theme.text, fontSize: scaled(19), fontWeight: '800' }, detail: { color: theme.secondaryText, fontSize: scaled(14), marginTop: 8 }, policy: { color: theme.accent, backgroundColor: theme.background, borderRadius: 10, padding: 10, marginTop: 16, fontSize: scaled(14) }, actions: { gap: 10, marginTop: 18 }, primary: { minHeight: 48, borderRadius: 12, backgroundColor: theme.inverseSurface, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }, primaryText: { color: theme.inverseText, fontWeight: '800', fontSize: scaled(14) }, secondary: { minHeight: 48, borderRadius: 12, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }, secondaryText: { color: theme.text, fontWeight: '800', fontSize: scaled(14) } });
}
