import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatBookingDate } from '@/domain/date';
import { presentBookingStatus } from '@/domain/booking-status';
import { useAppStore } from '@/state/app-store';
import { useCustomerTheme } from '@/hooks/use-customer-theme';

const STATUS_ACTION_TIMEOUT_MS = 20000;

export default function TodayScreen() {
  const router = useRouter();
  const theme = useCustomerTheme();
  const styles = createStyles(theme);
  const { role, bookings, bookingLoading, bookingError, updateBookingStatus } = useAppStore();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const pending = useMemo(() => bookings.filter((booking) => booking.status === 'pending').sort((left, right) => left.startsAt.localeCompare(right.startsAt)), [bookings]);
  const upcoming = useMemo(() => bookings.filter((booking) => booking.status === 'confirmed').sort((left, right) => left.startsAt.localeCompare(right.startsAt)), [bookings]);

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
    {bookingLoading ? <View style={styles.stateCard}><Text style={styles.cardTitle}>Loading appointments</Text><Text style={styles.copy}>Checking the studio schedule...</Text></View> : pending.length === 0 ? <View style={styles.emptyCard}><Text style={styles.cardTitle}>No pending requests</Text><Text style={styles.copy}>New customer requests will appear here for review.</Text></View> : <View><Text style={styles.sectionTitle}>Needs review</Text>{pending.map((booking) => <BookingCard key={booking.id} booking={booking} updating={updatingId === booking.id} onReview={review} onOpen={() => router.push({ pathname: '/booking/[id]', params: { id: booking.id } })} styles={styles} statusColors={theme.statusColors} />)}</View>}
    <Text style={styles.sectionTitle}>Upcoming</Text>
    {upcoming.length === 0 ? <Text style={styles.copy}>No confirmed appointments yet.</Text> : upcoming.map((booking) => <BookingCard key={booking.id} booking={booking} updating={false} onReview={review} onOpen={() => router.push({ pathname: '/booking/[id]', params: { id: booking.id } })} styles={styles} statusColors={theme.statusColors} />)}
  </ScrollView></SafeAreaView>;
}

function BookingCard({ booking, updating, onReview, onOpen, styles, statusColors }: { booking: ReturnType<typeof useAppStore>['bookings'][number]; updating: boolean; onReview: (id: string, status: 'confirmed' | 'declined') => void; onOpen: () => void; styles: ReturnType<typeof createStyles>; statusColors: ReturnType<typeof useCustomerTheme>['statusColors'] }) {
  const presentation = presentBookingStatus(booking.status);
  const isPending = booking.status === 'pending';
  return <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`Open details for ${booking.customerName ?? 'customer'}'s ${booking.serviceName} appointment`} accessibilityHint="Opens appointment details" style={styles.card}>
    <View style={styles.cardHeader}><View style={styles.identity}><Text style={styles.customer}>{booking.customerName ?? 'Customer'}</Text><Text style={styles.cardTitle}>{booking.serviceName}</Text></View><Text style={styles.price}>${booking.price}</Text></View>
    <Text style={styles.time}>{formatBookingDate(booking.startsAt)}</Text>
    <Text style={styles.detail}>{booking.barberName} / {booking.studioName}</Text>
    <Text style={[styles.status, { color: statusColors[presentation.tone] }]}>{presentation.label}</Text>
    <Text style={styles.statusExplanation}>{presentation.explanation}</Text>
    {isPending ? <View style={styles.actions}><Pressable accessibilityRole="button" accessibilityLabel={`Confirm ${booking.customerName ?? 'customer'}'s ${booking.serviceName} appointment at ${formatBookingDate(booking.startsAt)}`} accessibilityHint="Confirms this appointment for the customer." accessibilityState={{ disabled: updating, busy: updating }} disabled={updating} onPress={() => onReview(booking.id, 'confirmed')} style={styles.confirm}><Text style={styles.confirmText}>{updating ? 'Submitting...' : 'Confirm'}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Decline ${booking.customerName ?? 'customer'}'s ${booking.serviceName} appointment at ${formatBookingDate(booking.startsAt)}`} accessibilityHint="Declines this appointment for the customer." accessibilityState={{ disabled: updating, busy: updating }} disabled={updating} onPress={() => onReview(booking.id, 'declined')} style={styles.decline}><Text style={styles.declineText}>{updating ? 'Submitting...' : 'Decline'}</Text></Pressable></View> : <Text style={styles.readOnly}>Read-only appointment</Text>}
  </Pressable>;
}

function createStyles(theme: ReturnType<typeof useCustomerTheme>) {
  const scaled = (size: number) => size * theme.textScale;
  return StyleSheet.create({ safeArea: { flex: 1, backgroundColor: theme.background }, container: { padding: 18, paddingBottom: 48 }, eyebrow: { color: theme.accent, fontSize: scaled(12), fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }, title: { color: theme.text, fontSize: scaled(32), fontWeight: '800', marginTop: 6 }, subtitle: { color: theme.secondaryText, fontSize: scaled(15), lineHeight: scaled(22), marginTop: 4, marginBottom: 20 }, sectionTitle: { color: theme.text, fontSize: scaled(19), fontWeight: '800', marginTop: 22, marginBottom: 10 }, card: { backgroundColor: theme.surface, borderColor: theme.border, borderRadius: 14, borderWidth: 1, marginBottom: 10, padding: 16 }, cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, identity: { flex: 1, minWidth: 0 }, customer: { color: theme.text, fontSize: scaled(19), fontWeight: '800', lineHeight: scaled(24) }, cardTitle: { color: theme.text, fontSize: scaled(16), fontWeight: '700', lineHeight: scaled(22), marginTop: 3 }, price: { color: theme.text, fontSize: scaled(17), fontWeight: '800', flexShrink: 0 }, time: { color: theme.text, fontSize: scaled(15), fontWeight: '700', lineHeight: scaled(21), marginTop: 12 }, detail: { color: theme.secondaryText, fontSize: scaled(14), lineHeight: scaled(20), marginTop: 6 }, status: { fontSize: scaled(13), fontWeight: '800', lineHeight: scaled(18), marginTop: 11 }, statusExplanation: { color: theme.secondaryText, fontSize: scaled(13), lineHeight: scaled(19), marginTop: 3 }, readOnly: { color: theme.secondaryText, fontSize: scaled(13), fontWeight: '700', lineHeight: scaled(19), marginTop: 14 }, actions: { flexDirection: 'row', gap: 8, marginTop: 14 }, confirm: { backgroundColor: theme.inverseSurface, borderRadius: 10, flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 }, confirmText: { color: theme.inverseText, fontWeight: '800', fontSize: scaled(14), textAlign: 'center' }, decline: { backgroundColor: theme.surface, borderColor: theme.border, borderRadius: 10, borderWidth: 1, flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 }, declineText: { color: theme.text, fontWeight: '800', fontSize: scaled(14), textAlign: 'center' }, error: { color: '#A33A2B', lineHeight: scaled(20), marginBottom: 8 }, success: { color: '#28734A', lineHeight: scaled(20), marginBottom: 8 }, copy: { color: theme.secondaryText, fontSize: scaled(14), lineHeight: scaled(21), marginTop: 6 }, empty: { flex: 1, justifyContent: 'center', padding: 24 }, emptyCard: { backgroundColor: theme.surface, borderRadius: 14, padding: 16 }, stateCard: { backgroundColor: theme.surface, borderColor: theme.border, borderRadius: 14, borderWidth: 1, padding: 16 } });
}
