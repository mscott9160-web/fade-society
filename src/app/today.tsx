import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatBookingDate, getLocalDateKey, getRelativeDateLabel } from '@/domain/date';
import { presentBookingStatus } from '@/domain/booking-status';
import { useAppStore } from '@/state/app-store';
import { useCustomerTheme } from '@/hooks/use-customer-theme';

const STATUS_ACTION_TIMEOUT_MS = 20000;

export default function TodayScreen() {
  const router = useRouter();
  const theme = useCustomerTheme();
  const styles = createStyles(theme);
  const { role, bookings, bookingLoading, bookingError, refreshBookings, updateBookingStatus } = useAppStore();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [renderedAt] = useState(() => Date.now());
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const pending = useMemo(() => bookings.filter((booking) => booking.status === 'pending').sort((left, right) => left.startsAt.localeCompare(right.startsAt)), [bookings]);
  const confirmed = useMemo(() => bookings.filter((booking) => booking.status === 'confirmed').sort((left, right) => left.startsAt.localeCompare(right.startsAt)), [bookings]);
  const selectedDateKey = getLocalDateKey(selectedDate);
  const scheduled = confirmed.filter((booking) => getLocalDateKey(booking.startsAt) === selectedDateKey);
  const nextAppointment = confirmed.find((booking) => new Date(booking.startsAt).getTime() >= renderedAt);

  async function refresh() {
    setRefreshError(null);
    try {
      await Promise.race([
        refreshBookings(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Refresh is taking too long. Please try again.')), 15000)),
      ]);
      setLastUpdated(new Date());
    } catch (error: unknown) {
      setRefreshError(error instanceof Error ? error.message : 'The schedule could not be refreshed. Please try again.');
    }
  }

  async function review(id: string, status: 'confirmed' | 'declined' | 'completed' | 'no_show') {
    setActionError(null);
    setActionMessage(null);
    setUpdatingId(id);
    try {
      await Promise.race([
        updateBookingStatus(id, status),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('The booking update is taking too long. Please try again.')), STATUS_ACTION_TIMEOUT_MS)),
      ]);
      setActionMessage(`Booking ${status === 'confirmed' ? 'confirmed' : status === 'declined' ? 'declined' : status === 'completed' ? 'completed' : 'marked no-show'} successfully.`);
    } catch (error: unknown) {
      setActionError(`${error instanceof Error ? error.message : 'The booking could not be updated.'} Please try again.`);
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
    <Pressable accessibilityRole="button" accessibilityLabel="Open provider availability" accessibilityHint="Manage your next 14 days of appointment slots" onPress={() => router.push('/availability')} style={styles.confirm}><Text style={styles.confirmText}>Manage availability</Text></Pressable>
    <View style={styles.summary}><Text style={styles.summaryText}>{pending.length} pending / {confirmed.length} confirmed</Text><Text style={styles.summaryText}>{nextAppointment ? `Next: ${formatBookingDate(nextAppointment.startsAt)}` : 'No next appointment'}</Text></View>
    <View style={styles.toolbar}><Pressable accessibilityRole="button" accessibilityLabel="Refresh provider schedule" accessibilityState={{ disabled: bookingLoading, busy: bookingLoading }} disabled={bookingLoading} onPress={() => { void refresh(); }} style={styles.refresh}><Text style={styles.refreshText}>{bookingLoading ? 'Refreshing...' : 'Refresh schedule'}</Text></Pressable>{lastUpdated && <Text style={styles.updated}>Updated {lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text>}</View>
    {(bookingError || refreshError || actionError || actionMessage) && <Text accessibilityRole="alert" style={actionError || bookingError || refreshError ? styles.error : styles.success}>{actionError ?? refreshError ?? bookingError ?? actionMessage}</Text>}
    {bookingLoading && bookings.length === 0 && <View style={styles.stateCard}><Text style={styles.cardTitle}>Loading appointments</Text><Text style={styles.copy}>Checking the studio schedule...</Text></View>}
    {!bookingLoading && pending.length === 0 && <View style={styles.emptyCard}><Text style={styles.cardTitle}>No pending requests</Text><Text style={styles.copy}>New customer requests will appear here for review.</Text></View>}
    {pending.length > 0 && <View><Text style={styles.sectionTitle}>Needs review</Text>{pending.map((booking) => <BookingCard key={booking.id} booking={booking} updating={updatingId === booking.id} onReview={review} onOpen={() => router.push({ pathname: '/booking/[id]', params: { id: booking.id } })} styles={styles} statusColors={theme.statusColors} />)}</View>}
    <Text style={styles.sectionTitle}>Confirmed schedule</Text>
    <View style={styles.dateNav}><Pressable accessibilityRole="button" accessibilityLabel="Previous appointment date" onPress={() => setSelectedDate((date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1))} style={styles.navButton}><Text style={styles.navText}>Previous</Text></Pressable><Text accessibilityRole="header" style={styles.dateLabel}>{getRelativeDateLabel(selectedDate)}</Text><Pressable accessibilityRole="button" accessibilityLabel="Next appointment date" onPress={() => setSelectedDate((date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1))} style={styles.navButton}><Text style={styles.navText}>Next</Text></Pressable></View>
    {scheduled.length === 0 ? <Text style={styles.copy}>No confirmed appointments on this date.</Text> : scheduled.map((booking) => <BookingCard key={booking.id} booking={booking} updating={false} onReview={review} onOpen={() => router.push({ pathname: '/booking/[id]', params: { id: booking.id } })} styles={styles} statusColors={theme.statusColors} />)}
  </ScrollView></SafeAreaView>;
}

function BookingCard({ booking, updating, onReview, onOpen, styles, statusColors }: { booking: ReturnType<typeof useAppStore>['bookings'][number]; updating: boolean; onReview: (id: string, status: 'confirmed' | 'declined' | 'completed' | 'no_show') => void; onOpen: () => void; styles: ReturnType<typeof createStyles>; statusColors: ReturnType<typeof useCustomerTheme>['statusColors'] }) {
  const presentation = presentBookingStatus(booking.status);
  const isPending = booking.status === 'pending';
  const isConfirmed = booking.status === 'confirmed';
  function confirmNoShow() {
    Alert.alert('Mark appointment no-show?', 'Confirm the customer has been absent for your studio grace period before marking no-show.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Mark no-show', style: 'destructive', onPress: () => onReview(booking.id, 'no_show') },
    ]);
  }
  return <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`Open details for ${booking.customerName ?? 'customer'}'s ${booking.serviceName} appointment`} accessibilityHint="Opens appointment details" style={styles.card}>
    <View style={styles.cardHeader}><View style={styles.identity}><Text style={styles.customer}>{booking.customerName ?? 'Customer'}</Text><Text style={styles.cardTitle}>{booking.serviceName}</Text></View><Text style={styles.price}>${booking.price}</Text></View>
    <Text style={styles.time}>{formatBookingDate(booking.startsAt)}</Text>
    <Text style={styles.detail}>{booking.barberName} / {booking.studioName}</Text>
    <Text style={[styles.status, { color: statusColors[presentation.tone] }]}>{presentation.label}</Text>
    <Text style={styles.statusExplanation}>{presentation.explanation}</Text>
    {isPending ? <View style={styles.actions}><Pressable accessibilityRole="button" accessibilityLabel={`Confirm ${booking.customerName ?? 'customer'}'s ${booking.serviceName} appointment at ${formatBookingDate(booking.startsAt)}`} accessibilityHint="Confirms this appointment for the customer." accessibilityState={{ disabled: updating, busy: updating }} disabled={updating} onPress={() => onReview(booking.id, 'confirmed')} style={styles.confirm}><Text style={styles.confirmText}>{updating ? 'Submitting...' : 'Confirm'}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Decline ${booking.customerName ?? 'customer'}'s ${booking.serviceName} appointment at ${formatBookingDate(booking.startsAt)}`} accessibilityHint="Declines this appointment for the customer." accessibilityState={{ disabled: updating, busy: updating }} disabled={updating} onPress={() => onReview(booking.id, 'declined')} style={styles.decline}><Text style={styles.declineText}>{updating ? 'Submitting...' : 'Decline'}</Text></Pressable></View> : isConfirmed ? <><Text style={styles.copy}>Confirm the customer has been absent for your studio grace period before marking no-show.</Text><View style={styles.actions}><Pressable accessibilityRole="button" accessibilityLabel="Mark appointment completed" accessibilityState={{ disabled: updating, busy: updating }} disabled={updating} onPress={() => onReview(booking.id, 'completed')} style={styles.confirm}><Text style={styles.confirmText}>{updating ? 'Submitting...' : 'Complete'}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Mark appointment no-show" accessibilityState={{ disabled: updating, busy: updating }} disabled={updating} onPress={confirmNoShow} style={styles.decline}><Text style={styles.declineText}>{updating ? 'Submitting...' : 'No-show'}</Text></Pressable></View></> : <Text style={styles.readOnly}>Read-only appointment</Text>}
  </Pressable>;
}

function createStyles(theme: ReturnType<typeof useCustomerTheme>) {
  const scaled = (size: number) => size * theme.textScale;
  return StyleSheet.create({ safeArea: { flex: 1, backgroundColor: theme.background }, container: { padding: 18, paddingBottom: 48 }, eyebrow: { color: theme.accent, fontSize: scaled(12), fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }, title: { color: theme.text, fontSize: scaled(32), fontWeight: '800', marginTop: 6 }, subtitle: { color: theme.secondaryText, fontSize: scaled(15), lineHeight: scaled(22), marginTop: 4, marginBottom: 20 }, sectionTitle: { color: theme.text, fontSize: scaled(19), fontWeight: '800', marginTop: 22, marginBottom: 10 }, summary: { backgroundColor: theme.inverseSurface, borderRadius: 14, marginTop: 16, padding: 14, gap: 5 }, summaryText: { color: theme.inverseText, fontSize: scaled(14), fontWeight: '700' }, toolbar: { alignItems: 'center', flexDirection: 'row', gap: 10, marginTop: 12 }, refresh: { backgroundColor: theme.surface, borderColor: theme.border, borderRadius: 9, borderWidth: 1, minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 }, refreshText: { color: theme.text, fontSize: scaled(13), fontWeight: '800' }, updated: { color: theme.secondaryText, flexShrink: 1, fontSize: scaled(12) }, dateNav: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }, dateLabel: { color: theme.text, flex: 1, fontSize: scaled(16), fontWeight: '800', textAlign: 'center' }, navButton: { borderColor: theme.border, borderRadius: 9, borderWidth: 1, minHeight: 44, justifyContent: 'center', paddingHorizontal: 10 }, navText: { color: theme.text, fontSize: scaled(13), fontWeight: '800' }, card: { backgroundColor: theme.surface, borderColor: theme.border, borderRadius: 14, borderWidth: 1, marginBottom: 10, padding: 16 }, cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, identity: { flex: 1, minWidth: 0 }, customer: { color: theme.text, fontSize: scaled(19), fontWeight: '800', lineHeight: scaled(24) }, cardTitle: { color: theme.text, fontSize: scaled(16), fontWeight: '700', lineHeight: scaled(22), marginTop: 3 }, price: { color: theme.text, fontSize: scaled(17), fontWeight: '800', flexShrink: 0 }, time: { color: theme.text, fontSize: scaled(15), fontWeight: '700', lineHeight: scaled(21), marginTop: 12 }, detail: { color: theme.secondaryText, fontSize: scaled(14), lineHeight: scaled(20), marginTop: 6 }, status: { fontSize: scaled(13), fontWeight: '800', lineHeight: scaled(18), marginTop: 11 }, statusExplanation: { color: theme.secondaryText, fontSize: scaled(13), lineHeight: scaled(19), marginTop: 3 }, readOnly: { color: theme.secondaryText, fontSize: scaled(13), fontWeight: '700', lineHeight: scaled(19), marginTop: 14 }, actions: { flexDirection: 'row', gap: 8, marginTop: 14 }, confirm: { backgroundColor: theme.inverseSurface, borderRadius: 10, flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 }, confirmText: { color: theme.inverseText, fontWeight: '800', fontSize: scaled(14), textAlign: 'center' }, decline: { backgroundColor: theme.surface, borderColor: theme.border, borderRadius: 10, borderWidth: 1, flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 }, declineText: { color: theme.text, fontWeight: '800', fontSize: scaled(14), textAlign: 'center' }, error: { color: theme.statusColors.negative, lineHeight: scaled(20), marginBottom: 8 }, success: { color: theme.statusColors.positive, lineHeight: scaled(20), marginBottom: 8 }, copy: { color: theme.secondaryText, fontSize: scaled(14), lineHeight: scaled(21), marginTop: 6 }, empty: { flex: 1, justifyContent: 'center', padding: 24 }, emptyCard: { backgroundColor: theme.surface, borderRadius: 14, padding: 16 }, stateCard: { backgroundColor: theme.surface, borderColor: theme.border, borderRadius: 14, borderWidth: 1, padding: 16 } });
}
