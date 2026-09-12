import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatBookingDate } from '@/domain/date';
import { presentBookingStatus } from '@/domain/booking-status';
import { useCustomerTheme } from '@/hooks/use-customer-theme';
import { useAppStore } from '@/state/app-store';

export default function ProviderBookingDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const theme = useCustomerTheme();
  const styles = createStyles(theme);
  const { role, bookings, messages, listServices } = useAppStore();
  const booking = bookings.find((item) => item.id === id);
  const [duration, setDuration] = useState<number | null>(null);

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
  return <SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.container}>
    <Pressable accessibilityRole="button" accessibilityLabel="Back to Today" onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>Back to Today</Text></Pressable>
    <Text style={styles.eyebrow}>Appointment details</Text><Text accessibilityRole="header" style={styles.title}>{booking.customerName ?? 'Customer'}</Text><Text style={styles.subtitle}>{formatBookingDate(booking.startsAt)}</Text>
    <View style={styles.card}><Detail label="Service" value={booking.serviceName} styles={styles} /><Detail label="Duration" value={duration === null ? 'Loading service details...' : `${duration} minutes`} styles={styles} /><Detail label="Price" value={`$${booking.price}`} styles={styles} /><Detail label="Studio" value={booking.studioName} styles={styles} /><Detail label="Status" value={status.label} styles={styles} statusColor={theme.statusColors[status.tone]} /></View>
    {conversation ? <Pressable accessibilityRole="button" accessibilityLabel={`Open conversation with ${conversation.participantName}`} accessibilityHint="Opens the authorized booking conversation" onPress={() => router.push({ pathname: '/messages/[id]', params: { id: conversation.participantId, bookingId: booking.id } })} style={styles.conversation}><Text style={styles.conversationTitle}>Booking conversation</Text><Text style={styles.conversationText}>Message {conversation.participantName}</Text></Pressable> : <View style={styles.emptyCard}><Text style={styles.cardTitle}>No conversation available</Text><Text style={styles.copy}>The authorized booking conversation will appear here when available.</Text></View>}
  </ScrollView></SafeAreaView>;
}

function Detail({ label, value, styles, statusColor }: { label: string; value: string; styles: ReturnType<typeof createStyles>; statusColor?: string }) {
  return <View style={styles.detail}><Text style={styles.label}>{label}</Text><Text style={[styles.value, statusColor ? { color: statusColor } : null]}>{value}</Text></View>;
}

function createStyles(theme: ReturnType<typeof useCustomerTheme>) {
  const scaled = (size: number) => size * theme.textScale;
  return StyleSheet.create({ safeArea: { flex: 1, backgroundColor: theme.background }, container: { padding: 18, paddingBottom: 48 }, back: { minHeight: 44, justifyContent: 'center' }, backText: { color: theme.accent, fontWeight: '800', fontSize: scaled(14) }, eyebrow: { color: theme.accent, fontSize: scaled(12), fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginTop: 12 }, title: { color: theme.text, fontSize: scaled(30), fontWeight: '800', marginTop: 6 }, subtitle: { color: theme.secondaryText, fontSize: scaled(15), marginTop: 5, marginBottom: 20 }, card: { backgroundColor: theme.surface, borderColor: theme.border, borderRadius: 14, borderWidth: 1, padding: 16 }, detail: { borderBottomColor: theme.border, borderBottomWidth: 1, paddingVertical: 12 }, label: { color: theme.secondaryText, fontSize: scaled(12), fontWeight: '700', textTransform: 'uppercase' }, value: { color: theme.text, fontSize: scaled(16), fontWeight: '800', lineHeight: scaled(22), marginTop: 4 }, conversation: { backgroundColor: theme.inverseSurface, borderRadius: 12, marginTop: 16, padding: 16 }, conversationTitle: { color: theme.inverseText, fontSize: scaled(16), fontWeight: '800' }, conversationText: { color: theme.accent, fontSize: scaled(14), fontWeight: '700', marginTop: 5 }, emptyCard: { backgroundColor: theme.surface, borderRadius: 14, marginTop: 16, padding: 16 }, cardTitle: { color: theme.text, fontSize: scaled(16), fontWeight: '800' }, copy: { color: theme.secondaryText, fontSize: scaled(14), lineHeight: scaled(21), marginTop: 6 }, empty: { flex: 1, justifyContent: 'center', padding: 24 } });
}