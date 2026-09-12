import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatBookingDate } from '@/domain/date';
import { presentBookingStatus } from '@/domain/booking-status';
import { useCustomerTheme } from '@/hooks/use-customer-theme';
import { useAppStore } from '@/state/app-store';
import { getErrorMessage } from '@/domain/error';

const STATUS_ACTION_TIMEOUT_MS = 20000;

export default function ProviderBookingDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const theme = useCustomerTheme();
  const styles = createStyles(theme);
  const { role, bookings, messages, listServices, updateBookingStatus } = useAppStore();
  const booking = bookings.find((item) => item.id === id);
  const [duration, setDuration] = useState<number | null>(null);
  const [updating, setUpdating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!booking) return;
    let active = true;
    void listServices(booking.barberId).then((services) => {
      const service = services.find((item) => item.id === booking.serviceId);
      if (active) setDuration(service?.durationMinutes ?? null);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [booking, listServices]);

  if (!['barber', 'owner', 'admin'].includes(role) || !booking) {
    return <SafeAreaView style={styles.safeArea}><View style={styles.empty}><Text style={styles.title}>Appointment unavailable</Text><Text style={styles.copy}>This appointment is not available in your authorized provider view.</Text></View></SafeAreaView>;
  }

  const status = presentBookingStatus(booking.status);
  const conversation = messages.find((message) => message.bookingId === booking.id);
  const bookingId = booking.id;
  async function updateStatus(nextStatus: 'confirmed' | 'declined' | 'completed' | 'no_show') {
    setUpdating(true);
    setActionError(null);
    setActionMessage(null);
    try {
      await Promise.race([
        updateBookingStatus(bookingId, nextStatus),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('The booking update is taking too long. Please try again.')), STATUS_ACTION_TIMEOUT_MS)),
      ]);
      setActionMessage(`Booking ${nextStatus === 'confirmed' ? 'confirmed' : nextStatus === 'declined' ? 'declined' : nextStatus === 'completed' ? 'completed' : 'marked no-show'} successfully.`);
    } catch (error: unknown) {
      setActionError(`${getErrorMessage(error, 'The appointment could not be updated.')} Please try again.`);
    } finally {
      setUpdating(false);
    }
  }
  return <SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.container}>
    <Pressable accessibilityRole="button" accessibilityLabel="Back to Today" onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>Back to Today</Text></Pressable>
    <Text style={styles.eyebrow}>Appointment details</Text><Text accessibilityRole="header" style={styles.title}>{booking.customerName ?? 'Customer'}</Text><Text style={styles.subtitle}>{formatBookingDate(booking.startsAt)}</Text>
    <View style={styles.card}><Detail label="Service" value={booking.serviceName} styles={styles} /><Detail label="Duration" value={duration === null ? 'Loading service details...' : `${duration} minutes`} styles={styles} /><Detail label="Price" value={`$${booking.price}`} styles={styles} /><Detail label="Studio" value={booking.studioName} styles={styles} /><Detail label="Status" value={status.label} styles={styles} statusColor={theme.statusColors[status.tone]} /></View>
    {(actionError || actionMessage) && <Text accessibilityRole="alert" style={actionError ? styles.error : styles.success}>{actionError ?? actionMessage}</Text>}
    {booking.status === 'pending' && <View style={styles.actions}><Pressable accessibilityRole="button" accessibilityLabel="Confirm appointment" accessibilityState={{ disabled: updating, busy: updating }} disabled={updating} onPress={() => updateStatus('confirmed')} style={styles.confirm}><Text style={styles.confirmText}>{updating ? 'Submitting...' : 'Confirm'}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Decline appointment" accessibilityState={{ disabled: updating, busy: updating }} disabled={updating} onPress={() => updateStatus('declined')} style={styles.decline}><Text style={styles.declineText}>{updating ? 'Submitting...' : 'Decline'}</Text></Pressable></View>}
    {booking.status === 'confirmed' && <View style={styles.actions}><Pressable accessibilityRole="button" accessibilityLabel="Mark appointment completed" accessibilityState={{ disabled: updating, busy: updating }} disabled={updating} onPress={() => updateStatus('completed')} style={styles.confirm}><Text style={styles.confirmText}>{updating ? 'Submitting...' : 'Complete'}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Mark appointment no-show" accessibilityState={{ disabled: updating, busy: updating }} disabled={updating} onPress={() => updateStatus('no_show')} style={styles.decline}><Text style={styles.declineText}>{updating ? 'Submitting...' : 'No-show'}</Text></Pressable></View>}
    {['declined', 'completed', 'cancelled', 'no_show'].includes(booking.status) && <Text style={styles.readOnly}>Read-only appointment: {status.explanation}</Text>}
    {conversation ? <Pressable accessibilityRole="button" accessibilityLabel={`Open conversation with ${conversation.participantName}`} accessibilityHint="Opens the authorized booking conversation" onPress={() => router.push({ pathname: '/messages/[id]', params: { id: conversation.participantId, bookingId: booking.id } })} style={styles.conversation}><Text style={styles.conversationTitle}>Booking conversation</Text><Text style={styles.conversationText}>Message {conversation.participantName}</Text></Pressable> : <View style={styles.emptyCard}><Text style={styles.cardTitle}>No conversation available</Text><Text style={styles.copy}>The authorized booking conversation will appear here when available.</Text></View>}
  </ScrollView></SafeAreaView>;
}

function Detail({ label, value, styles, statusColor }: { label: string; value: string; styles: ReturnType<typeof createStyles>; statusColor?: string }) {
  return <View style={styles.detail}><Text style={styles.label}>{label}</Text><Text style={[styles.value, statusColor ? { color: statusColor } : null]}>{value}</Text></View>;
}

function createStyles(theme: ReturnType<typeof useCustomerTheme>) {
  const scaled = (size: number) => size * theme.textScale;
  return StyleSheet.create({ safeArea: { flex: 1, backgroundColor: theme.background }, container: { padding: 18, paddingBottom: 48 }, back: { minHeight: 44, justifyContent: 'center' }, backText: { color: theme.accent, fontWeight: '800', fontSize: scaled(14) }, eyebrow: { color: theme.accent, fontSize: scaled(12), fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginTop: 12 }, title: { color: theme.text, fontSize: scaled(30), fontWeight: '800', marginTop: 6 }, subtitle: { color: theme.secondaryText, fontSize: scaled(15), marginTop: 5, marginBottom: 20 }, card: { backgroundColor: theme.surface, borderColor: theme.border, borderRadius: 14, borderWidth: 1, padding: 16 }, detail: { borderBottomColor: theme.border, borderBottomWidth: 1, paddingVertical: 12 }, label: { color: theme.secondaryText, fontSize: scaled(12), fontWeight: '700', textTransform: 'uppercase' }, value: { color: theme.text, fontSize: scaled(16), fontWeight: '800', lineHeight: scaled(22), marginTop: 4 }, actions: { flexDirection: 'row', gap: 8, marginTop: 16 }, confirm: { backgroundColor: theme.inverseSurface, borderRadius: 10, flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 }, confirmText: { color: theme.inverseText, fontWeight: '800', fontSize: scaled(14) }, decline: { backgroundColor: theme.surface, borderColor: theme.border, borderRadius: 10, borderWidth: 1, flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 }, declineText: { color: theme.text, fontWeight: '800', fontSize: scaled(14) }, error: { color: '#A33A2B', lineHeight: scaled(20), marginTop: 12 }, success: { color: '#28734A', lineHeight: scaled(20), marginTop: 12 }, readOnly: { color: theme.secondaryText, fontSize: scaled(13), lineHeight: scaled(20), marginTop: 14 }, conversation: { backgroundColor: theme.inverseSurface, borderRadius: 12, marginTop: 16, padding: 16 }, conversationTitle: { color: theme.inverseText, fontSize: scaled(16), fontWeight: '800' }, conversationText: { color: theme.accent, fontSize: scaled(14), fontWeight: '700', marginTop: 5 }, emptyCard: { backgroundColor: theme.surface, borderRadius: 14, marginTop: 16, padding: 16 }, cardTitle: { color: theme.text, fontSize: scaled(16), fontWeight: '800' }, copy: { color: theme.secondaryText, fontSize: scaled(14), lineHeight: scaled(21), marginTop: 6 }, empty: { flex: 1, justifyContent: 'center', padding: 24 } });
}