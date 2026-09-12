import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatBookingDate, makeSlotDate } from '@/domain/date';
import { useAppStore } from '@/state/app-store';
import type { Booking } from '@/domain/models';
import { getDataMode } from '@/data/supabase-client';
import { useCustomerTheme } from '@/hooks/use-customer-theme';
import { presentBookingStatus } from '@/domain/booking-status';
import { getErrorMessage } from '@/domain/error';

export default function BookingsScreen() {
  const { bookings, hydrated, persistenceError, bookingLoading, bookingError, listAvailability, rescheduleBooking, cancelBooking, restoreBooking } = useAppStore();
  const live = getDataMode() === 'supabase';
  const theme = useCustomerTheme();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const active = bookings.filter((booking) => presentBookingStatus(booking.status).category === 'active');
  const attention = bookings.filter((booking) => presentBookingStatus(booking.status).category === 'attention');
  const history = bookings.filter((booking) => presentBookingStatus(booking.status).category === 'history');
  const slots = useMemo(() => [9, 11, 13, 15, 17].flatMap((hour) => [0, 1].map((day) => makeSlotDate(day, hour))), []);

  useEffect(() => {
    if (!live || !selectedBooking) return;
    let activeRequest = true;
    const from = new Date().toISOString();
    const to = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();
    Promise.resolve().then(() => {
      if (!activeRequest) return;
      setAvailabilityLoading(true);
      setAvailabilityError(null);
      setAvailableSlots([]);
    });
    Promise.race([
      listAvailability(selectedBooking.barberId, from, to),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Availability took too long to load. Please try again.')), 15000)),
    ]).then((nextSlots) => {
      if (activeRequest) setAvailableSlots(nextSlots.filter((slot) => slot.available).map((slot) => slot.startsAt));
    }).catch((error: unknown) => {
      if (activeRequest) setAvailabilityError(getErrorMessage(error, 'Availability could not be loaded. Please try again.'));
    }).finally(() => { if (activeRequest) setAvailabilityLoading(false); });
    return () => { activeRequest = false; };
  }, [listAvailability, live, selectedBooking]);

  function openReschedule(booking: Booking) {
    setFeedback(null);
    setActionError(null);
    setSelectedBooking(booking);
    setSelectedSlot(booking.startsAt);
  }

  function confirmCancellation(booking: Booking) {
    Alert.alert('Cancel appointment?', 'Free cancellation is available more than 24 hours before the appointment.', [
      { text: 'Keep appointment', style: 'cancel' },
      { text: 'Cancel appointment', style: 'destructive', onPress: () => {
        setSubmitting(true);
        setFeedback(null);
        setActionError(null);
        void cancelBooking(booking.id).then(() => setFeedback('Your appointment was cancelled.')).catch((error: unknown) => setActionError(getErrorMessage(error, 'Cancellation unavailable. Please try again.'))).finally(() => setSubmitting(false));
      } },
    ]);
  }

  async function saveReschedule() {
    if (!selectedBooking || !selectedSlot) return;
    setSubmitting(true);
    setFeedback(null);
    setActionError(null);
    try {
      await rescheduleBooking(selectedBooking.id, selectedSlot);
      setSelectedBooking(null);
      setFeedback('Your appointment was rescheduled.');
    } catch (error) {
      setActionError(getErrorMessage(error, 'Rescheduling unavailable. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (!hydrated || bookingLoading) return <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}><View style={styles.empty}><Text style={[styles.title, { color: theme.text, fontSize: 32 * theme.textScale }]}>Loading your bookings...</Text></View></SafeAreaView>;

  return <SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.container}>
    <Text style={[styles.title, { color: theme.text, fontSize: 32 * theme.textScale }]}>Bookings</Text>
    <Text style={[styles.subtitle, { color: theme.secondaryText, fontSize: 14 * theme.textScale }]}>Your appointments, all in one place.</Text>
    {persistenceError && <Text accessibilityRole="alert" style={styles.warning}>{persistenceError}</Text>}
    {bookingError && <Text accessibilityRole="alert" style={styles.warning}>{bookingError}</Text>}
    {feedback && <Text accessibilityRole="alert" style={styles.warning}>{feedback}</Text>}
    {actionError && <Text accessibilityRole="alert" style={styles.warning}>{actionError}</Text>}
    {active.length === 0 && attention.length === 0 && <View style={[styles.emptyCard, { backgroundColor: theme.surface }]}><Text style={[styles.sectionTitle, { color: theme.text, fontSize: 18 * theme.textScale }]}>Nothing booked yet</Text><Text style={[styles.subtitle, { color: theme.secondaryText }]}>Find a barber and choose a time that works for you.</Text></View>}
    {active.length > 0 && <Text style={[styles.sectionTitle, { color: theme.text }]}>Upcoming</Text>}{active.map((booking) => <BookingCard key={booking.id} booking={booking} live={live} theme={theme} submitting={submitting} onReschedule={() => openReschedule(booking)} onCancel={() => confirmCancellation(booking)} />)}
    {attention.length > 0 && <Text style={[styles.sectionTitle, { color: theme.text }]}>Needs attention</Text>}{attention.map((booking) => <BookingCard key={booking.id} booking={booking} live={live} theme={theme} submitting={submitting} onReschedule={() => openReschedule(booking)} onCancel={() => {}} />)}
    {history.length > 0 && <><Text style={[styles.sectionTitle, { color: theme.text }]}>History</Text>{history.map((booking) => { const status = presentBookingStatus(booking.status); return <View key={booking.id} style={[styles.card, styles.mutedCard, { backgroundColor: theme.surface, borderColor: theme.border }]}><Text style={[styles.service, { color: theme.text }]}>{booking.serviceName}</Text><Text style={[styles.meta, { color: theme.secondaryText }]}>{formatBookingDate(booking.startsAt)} / {booking.barberName}</Text><Text accessibilityRole="text" style={[styles.status, { color: theme.statusColors[status.tone] }]}>{status.label}</Text><Text style={[styles.meta, { color: theme.secondaryText }]}>{status.explanation}</Text>{!live && booking.status === 'cancelled' && <Pressable accessibilityRole="button" accessibilityLabel={`Restore ${booking.serviceName}`} onPress={() => restoreBooking(booking.id)} style={styles.secondaryButton}><Text style={styles.secondaryText}>Restore booking</Text></Pressable>}</View>; })}</>}
  </ScrollView>
  <Modal visible={Boolean(selectedBooking)} transparent animationType="slide" onRequestClose={() => setSelectedBooking(null)}><View style={styles.overlay}><View style={styles.modal}><Text style={styles.modalTitle}>Reschedule appointment</Text><Text style={styles.subtitle}>Choose a new time for {selectedBooking?.serviceName}.</Text>{availabilityLoading && <Text style={styles.meta}>Loading available times...</Text>}{availabilityError && <Text accessibilityRole="alert" style={styles.warning}>{availabilityError}</Text>}{!availabilityLoading && !availabilityError && availableSlots.length === 0 && live && <Text style={styles.meta}>No available times in the next 14 days.</Text>}<View style={styles.grid}>{(live ? availableSlots : slots).map((slot) => <Pressable key={slot} accessibilityRole="button" accessibilityLabel={`Choose ${formatBookingDate(slot)}`} accessibilityState={{ selected: selectedSlot === slot }} onPress={() => setSelectedSlot(slot)} style={[styles.slot, selectedSlot === slot && styles.active]}><Text style={styles.slotText}>{formatBookingDate(slot)}</Text></Pressable>)}</View><View style={styles.actions}><Pressable accessibilityRole="button" accessibilityLabel="Close reschedule dialog" onPress={() => setSelectedBooking(null)} style={styles.secondaryButton}><Text style={styles.secondaryText}>Close</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Save new appointment time" accessibilityState={{ disabled: !selectedSlot || submitting || availabilityLoading }} disabled={!selectedSlot || submitting || availabilityLoading} onPress={() => { void saveReschedule(); }} style={[styles.confirm, (!selectedSlot || submitting || availabilityLoading) && styles.disabled]}><Text style={styles.confirmText}>{submitting ? 'Saving...' : 'Save time'}</Text></Pressable></View></View></View></Modal></SafeAreaView>;
}

function BookingCard({ booking, live, theme, submitting, onReschedule, onCancel }: { booking: Booking; live: boolean; theme: ReturnType<typeof useCustomerTheme>; submitting: boolean; onReschedule: () => void; onCancel: () => void }) {
  const status = presentBookingStatus(booking.status);
  const canChangeLive = booking.status === 'pending' || booking.status === 'confirmed';
  return <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}><View style={styles.cardTop}><View><Text style={[styles.service, { color: theme.text }]}>{booking.serviceName}</Text><Text style={[styles.meta, { color: theme.secondaryText }]}>{booking.barberName} / {booking.studioName}</Text></View><Text accessibilityRole="text" style={[styles.status, { color: theme.statusColors[status.tone] }]}>{status.label}</Text></View><Text style={[styles.date, { color: theme.text }]}>{formatBookingDate(booking.startsAt)}</Text><Text style={[styles.meta, { color: theme.secondaryText }]}>{status.explanation}</Text><Text style={[styles.meta, { color: theme.secondaryText }]}>Reference {booking.confirmationCode}</Text><Text style={{ color: theme.accent, fontSize: 12, marginTop: 10 }}>{booking.cancellationPolicy}</Text>{live && canChangeLive && <View style={styles.actions}><Pressable accessibilityRole="button" accessibilityLabel={`Reschedule ${booking.serviceName}`} disabled={submitting} onPress={onReschedule} style={styles.secondaryButton}><Text style={styles.secondaryText}>Reschedule</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Cancel ${booking.serviceName}`} disabled={submitting} onPress={onCancel} style={styles.cancelButton}><Text style={styles.cancelText}>Cancel</Text></Pressable></View>}{!live && <View style={styles.actions}><Pressable accessibilityRole="button" accessibilityLabel={`Reschedule ${booking.serviceName}`} onPress={onReschedule} style={styles.secondaryButton}><Text style={styles.secondaryText}>Reschedule</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Cancel ${booking.serviceName}`} onPress={onCancel} style={styles.cancelButton}><Text style={styles.cancelText}>Cancel</Text></Pressable></View>}</View>;
}

const styles = StyleSheet.create({ safeArea: { flex: 1, backgroundColor: '#F5F0EA' }, container: { padding: 18, paddingBottom: 48 }, title: { color: '#171717', fontSize: 32, fontWeight: '800', marginTop: 12 }, subtitle: { color: '#736C62', marginTop: 6, marginBottom: 18 }, warning: { color: '#8C4A1D', backgroundColor: '#FCE7D5', padding: 12, borderRadius: 10, marginBottom: 14 }, card: { backgroundColor: '#FFF', borderRadius: 18, borderWidth: 1, borderColor: '#E9DED0', padding: 16, marginBottom: 14 }, mutedCard: { opacity: 0.72 }, cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 }, service: { color: '#171717', fontSize: 18, fontWeight: '800' }, meta: { color: '#736C62', marginTop: 5 }, date: { color: '#171717', fontSize: 16, fontWeight: '800', marginTop: 16 }, status: { color: '#1E7A4B', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' }, sectionTitle: { color: '#171717', fontSize: 18, fontWeight: '800', marginTop: 18, marginBottom: 10 }, empty: { padding: 24 }, emptyCard: { backgroundColor: '#FFF', borderRadius: 18, padding: 18, marginTop: 18 }, actions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 16 }, secondaryButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#F1EDE6' }, secondaryText: { color: '#171717', fontWeight: '800' }, cancelButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#FDECEA' }, cancelText: { color: '#B93A2F', fontWeight: '800' }, overlay: { flex: 1, justifyContent: 'center', padding: 18, backgroundColor: 'rgba(0,0,0,.42)' }, modal: { backgroundColor: '#FFF', borderRadius: 18, padding: 18 }, modalTitle: { color: '#171717', fontSize: 20, fontWeight: '800' }, grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 14 }, slot: { minHeight: 44, padding: 11, borderRadius: 10, backgroundColor: '#F4F1EA', marginRight: 8, marginBottom: 8 }, active: { backgroundColor: '#171717' }, slotText: { color: '#171717', fontWeight: '700' }, confirm: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#D9B778' }, disabled: { opacity: 0.45 }, confirmText: { color: '#171717', fontWeight: '800' } });
