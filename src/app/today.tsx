import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatBookingDate } from '@/domain/date';
import { presentBookingStatus } from '@/domain/booking-status';
import { useAppStore } from '@/state/app-store';
import { useCustomerTheme } from '@/hooks/use-customer-theme';

const STATUS_ACTION_TIMEOUT_MS = 20000;

export default function TodayScreen() {
  const theme = useCustomerTheme();
  const styles = createStyles(theme);
  const { role, bookings, bookingLoading, bookingError, updateBookingStatus } = useAppStore();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const pending = useMemo(() => bookings.filter((booking) => booking.status === 'pending').sort((left, right) => left.startsAt.localeCompare(right.startsAt)), [bookings]);
  const upcoming = useMemo(() => bookings.filter((booking) => ['confirmed', 'pending'].includes(booking.status)).sort((left, right) => left.startsAt.localeCompare(right.startsAt)), [bookings]);

  async function review(id: string, status: 'confirmed' | 'declined') {
    setActionError(null);
    setActionMessage(null);
    setUpdatingId(id);
    try {
      await Promise.race([
        updateBookingStatus(id, status),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('The booking update is taking too long. Please try again.')), STATUS_ACTION_TIMEOUT_MS)),
      ]);
      setActionMessage(`Booking ${status === 'confirmed' ? 'confirmed' : 'declined'} successfully.`);
    } catch (error: unknown) {
      setActionError(error instanceof Error ? error.message : 'The booking could not be updated.');
    } finally {
      setUpdatingId(null);
    }
  }

  if (!['barber', 'owner', 'admin'].includes(role)) {
    return <SafeAreaView style={styles.safeArea}><View style={styles.empty}><Text style={styles.title}>Provider access required</Text><Text style={styles.copy}>Sign in with a barber, owner, or admin account to manage appointments.</Text></View></SafeAreaView>;
  }

  return <SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.container}>
    <Text style={styles.eyebrow}>Provider desk</Text>
    <Text style={styles.title}>Today</Text>
    <Text style={styles.subtitle}>Review requests and keep the studio schedule moving.</Text>
    {(bookingError || actionError || actionMessage) && <Text accessibilityRole="alert" style={actionError || bookingError ? styles.error : styles.success}>{actionError ?? bookingError ?? actionMessage}</Text>}
    {bookingLoading ? <Text style={styles.copy}>Loading appointments...</Text> : pending.length === 0 ? <View style={styles.emptyCard}><Text style={styles.cardTitle}>No pending requests</Text><Text style={styles.copy}>New customer requests will appear here for review.</Text></View> : <View><Text style={styles.sectionTitle}>Needs review</Text>{pending.map((booking) => <BookingCard key={booking.id} booking={booking} updating={updatingId === booking.id} onReview={review} styles={styles} />)}</View>}
    <Text style={styles.sectionTitle}>Upcoming</Text>
    {upcoming.length === 0 ? <Text style={styles.copy}>No upcoming appointments.</Text> : upcoming.map((booking) => <View key={booking.id} style={styles.card}><Text style={styles.cardTitle}>{booking.serviceName}</Text><Text style={styles.detail}>{formatBookingDate(booking.startsAt)}</Text><Text style={styles.detail}>{booking.barberName} / {booking.studioName}</Text><Text style={styles.status}>{presentBookingStatus(booking.status).label}</Text></View>)}
  </ScrollView></SafeAreaView>;
}

function BookingCard({ booking, updating, onReview, styles }: { booking: ReturnType<typeof useAppStore>['bookings'][number]; updating: boolean; onReview: (id: string, status: 'confirmed' | 'declined') => void; styles: ReturnType<typeof createStyles> }) {
  return <View style={styles.card}><Text style={styles.cardTitle}>{booking.serviceName}</Text><Text style={styles.detail}>{formatBookingDate(booking.startsAt)}</Text><Text style={styles.detail}>{booking.barberName} / {booking.studioName}</Text><Text style={styles.detail}>${booking.price}</Text><View style={styles.actions}><Pressable accessibilityRole="button" accessibilityState={{ disabled: updating, busy: updating }} disabled={updating} onPress={() => onReview(booking.id, 'confirmed')} style={styles.confirm}><Text style={styles.confirmText}>{updating ? 'Submitting...' : 'Confirm'}</Text></Pressable><Pressable accessibilityRole="button" accessibilityState={{ disabled: updating, busy: updating }} disabled={updating} onPress={() => onReview(booking.id, 'declined')} style={styles.decline}><Text style={styles.declineText}>{updating ? 'Submitting...' : 'Decline'}</Text></Pressable></View></View>;
}

function createStyles(theme: ReturnType<typeof useCustomerTheme>) {
  const scaled = (size: number) => size * theme.textScale;
  return StyleSheet.create({ safeArea: { flex: 1, backgroundColor: theme.background }, container: { padding: 18, paddingBottom: 48 }, eyebrow: { color: theme.accent, fontSize: scaled(12), fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }, title: { color: theme.text, fontSize: scaled(32), fontWeight: '800', marginTop: 6 }, subtitle: { color: theme.secondaryText, fontSize: scaled(15), lineHeight: scaled(22), marginTop: 4, marginBottom: 20 }, sectionTitle: { color: theme.text, fontSize: scaled(19), fontWeight: '800', marginTop: 22, marginBottom: 10 }, card: { backgroundColor: theme.surface, borderColor: theme.border, borderRadius: 14, borderWidth: 1, marginBottom: 10, padding: 16 }, cardTitle: { color: theme.text, fontSize: scaled(17), fontWeight: '800' }, detail: { color: theme.secondaryText, fontSize: scaled(14), marginTop: 7 }, status: { color: theme.accent, fontSize: scaled(13), fontWeight: '800', marginTop: 10 }, actions: { flexDirection: 'row', gap: 8, marginTop: 14 }, confirm: { backgroundColor: theme.inverseSurface, borderRadius: 10, flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 }, confirmText: { color: theme.inverseText, fontWeight: '800', fontSize: scaled(14) }, decline: { backgroundColor: theme.surface, borderColor: theme.border, borderRadius: 10, borderWidth: 1, flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 }, declineText: { color: theme.text, fontWeight: '800', fontSize: scaled(14) }, error: { color: '#A33A2B', lineHeight: scaled(20), marginBottom: 8 }, success: { color: '#28734A', lineHeight: scaled(20), marginBottom: 8 }, copy: { color: theme.secondaryText, fontSize: scaled(14), lineHeight: scaled(21), marginTop: 6 }, empty: { flex: 1, justifyContent: 'center', padding: 24 }, emptyCard: { backgroundColor: theme.surface, borderRadius: 14, padding: 16 } });
}
