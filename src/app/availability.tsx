import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '@/state/app-store';
import { useCustomerTheme } from '@/hooks/use-customer-theme';
import type { ProviderAvailabilitySlot } from '@/domain/models';

const PROVIDER_ROLES = ['barber', 'owner', 'admin'];
const DAY_COUNT = 14;

function toIso(dateText: string, timeText: string): string | null {
  const value = new Date(`${dateText}T${timeText}:00`);
  return Number.isNaN(value.getTime()) ? null : value.toISOString();
}

function getRange() {
  const from = new Date();
  const to = new Date(from);
  to.setDate(to.getDate() + DAY_COUNT);
  return { from: from.toISOString(), to: to.toISOString() };
}

export default function AvailabilityScreen() {
  const router = useRouter();
  const theme = useCustomerTheme();
  const styles = createStyles(theme);
  const { role, currentUser, barbers, listProviderSlots, addProviderSlot, removeProviderSlot } = useAppStore();
  const providerAccess = PROVIDER_ROLES.includes(role);
  const defaultBarberId = role === 'barber' ? currentUser?.id : barbers[0]?.id;
  const [selectedBarberId, setSelectedBarberId] = useState<string | undefined>(defaultBarberId);
  const range = useMemo(() => getRange(), []);
  const [slots, setSlots] = useState<ProviderAvailabilitySlot[]>([]);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const activeBarberId = role === 'barber' ? currentUser?.id : selectedBarberId ?? barbers[0]?.id;

  useEffect(() => {
    if (!providerAccess || !currentUser || !activeBarberId) return;
    let active = true;
    listProviderSlots(activeBarberId, range.from, range.to).then((next) => { if (active) setSlots(next); }).catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Availability could not be loaded.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [activeBarberId, currentUser, listProviderSlots, providerAccess, range.from, range.to]);

  async function submit() {
    setError(null); setMessage(null);
    const startsAt = toIso(date, startTime);
    const endsAt = toIso(date, endTime);
    if (!date || !startTime || !endTime || !startsAt || !endsAt) { setError('Enter a valid date and both times.'); return; }
    if (new Date(startsAt) <= new Date() || new Date(startsAt) >= new Date(endsAt)) { setError('Choose a future slot with an end time after the start time.'); return; }
    if (!currentUser || !activeBarberId) { setError('Select a barber before adding availability.'); return; }
    setSubmitting(true);
    try {
      const slot = await addProviderSlot(activeBarberId, startsAt, endsAt);
      setSlots((current) => [...current, slot].sort((left, right) => left.startsAt.localeCompare(right.startsAt)));
      setDate(''); setStartTime(''); setEndTime(''); setMessage('Availability added.');
    } catch (cause: unknown) { setError(cause instanceof Error ? cause.message : 'Availability could not be added.'); } finally { setSubmitting(false); }
  }

  async function remove(slot: ProviderAvailabilitySlot) {
    setError(null); setMessage(null); setRemovingId(slot.id);
    try { await removeProviderSlot(slot.id); setSlots((current) => current.filter((item) => item.id !== slot.id)); setMessage('Availability removed.'); } catch (cause: unknown) { setError(cause instanceof Error ? cause.message : 'Availability could not be removed.'); } finally { setRemovingId(null); }
  }

  if (!providerAccess) return <SafeAreaView style={styles.safeArea}><View style={styles.empty}><Text style={styles.title}>Provider access required</Text><Text style={styles.copy}>Sign in with a barber, owner, or admin account to manage availability.</Text></View></SafeAreaView>;
  const barberSelector = role !== 'barber' ? <><Text style={styles.sectionTitle}>Barber</Text><View style={styles.barberList}>{barbers.map((barber) => <Pressable key={barber.id} accessibilityRole="button" accessibilityState={{ selected: activeBarberId === barber.id }} onPress={() => { setSelectedBarberId(barber.id); setLoading(true); setSlots([]); setError(null); }} style={[styles.barber, activeBarberId === barber.id && styles.barberActive]}><Text style={[styles.barberText, activeBarberId === barber.id && styles.barberTextActive]}>{barber.name}</Text></Pressable>)}</View></> : null;
  return <SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.container}><Pressable accessibilityRole="button" accessibilityLabel="Back to Today" onPress={() => router.back()}><Text style={styles.back}>Back to Today</Text></Pressable><Text style={styles.eyebrow}>Provider schedule</Text><Text style={styles.title}>Availability</Text><Text style={styles.subtitle}>Your next 14 days of appointment slots.</Text>{(error || message) && <Text accessibilityRole="alert" style={error ? styles.error : styles.success}>{error ?? message}</Text>}{barberSelector}<View style={styles.form}><Text style={styles.sectionTitle}>Add a future slot</Text><TextInput accessibilityLabel="Slot date" placeholder="Date: YYYY-MM-DD" placeholderTextColor={theme.secondaryText} value={date} onChangeText={setDate} style={styles.input} autoCapitalize="none" /><TextInput accessibilityLabel="Slot start time" placeholder="Start time: HH:MM" placeholderTextColor={theme.secondaryText} value={startTime} onChangeText={setStartTime} style={styles.input} autoCapitalize="none" /><TextInput accessibilityLabel="Slot end time" placeholder="End time: HH:MM" placeholderTextColor={theme.secondaryText} value={endTime} onChangeText={setEndTime} style={styles.input} autoCapitalize="none" /><Pressable accessibilityRole="button" accessibilityState={{ disabled: submitting, busy: submitting }} disabled={submitting} onPress={() => { void submit(); }} style={styles.primary}><Text style={styles.primaryText}>{submitting ? 'Adding...' : 'Add slot'}</Text></Pressable></View><Text style={styles.sectionTitle}>Upcoming slots</Text>{loading ? <Text style={styles.copy}>Loading availability...</Text> : slots.length === 0 ? <Text style={styles.copy}>No availability in the next 14 days.</Text> : slots.map((slot) => <View key={slot.id} style={styles.slot}><View style={styles.slotText}><Text style={styles.slotDate}>{new Date(slot.startsAt).toLocaleDateString()}</Text><Text style={styles.copy}>{new Date(slot.startsAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - {new Date(slot.endsAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={`Remove slot on ${new Date(slot.startsAt).toLocaleDateString()}`} accessibilityState={{ disabled: removingId === slot.id, busy: removingId === slot.id }} disabled={removingId === slot.id} onPress={() => { void remove(slot); }} style={styles.remove}><Text style={styles.removeText}>{removingId === slot.id ? 'Removing...' : 'Remove'}</Text></Pressable></View>)}</ScrollView></SafeAreaView>;
}

function createStyles(theme: ReturnType<typeof useCustomerTheme>) { const scaled = (size: number) => size * theme.textScale; return StyleSheet.create({ safeArea: { flex: 1, backgroundColor: theme.background }, container: { padding: 18, paddingBottom: 48 }, back: { color: theme.accent, fontWeight: '800', marginBottom: 24 }, eyebrow: { color: theme.accent, fontSize: scaled(12), fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }, title: { color: theme.text, fontSize: scaled(32), fontWeight: '800', marginTop: 6 }, subtitle: { color: theme.secondaryText, fontSize: scaled(15), marginTop: 4, marginBottom: 18 }, sectionTitle: { color: theme.text, fontSize: scaled(19), fontWeight: '800', marginBottom: 10 }, barberList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }, barber: { borderColor: theme.border, borderRadius: 9, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 }, barberActive: { backgroundColor: theme.inverseSurface, borderColor: theme.inverseSurface }, barberText: { color: theme.text, fontSize: scaled(14), fontWeight: '700' }, barberTextActive: { color: theme.inverseText }, form: { backgroundColor: theme.surface, borderColor: theme.border, borderRadius: 14, borderWidth: 1, padding: 16 }, input: { borderColor: theme.border, borderRadius: 9, borderWidth: 1, color: theme.text, minHeight: 46, marginBottom: 10, paddingHorizontal: 12 }, primary: { alignItems: 'center', backgroundColor: theme.inverseSurface, borderRadius: 10, justifyContent: 'center', minHeight: 46 }, primaryText: { color: theme.inverseText, fontWeight: '800' }, slot: { alignItems: 'center', backgroundColor: theme.surface, borderColor: theme.border, borderRadius: 12, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, padding: 14 }, slotText: { flex: 1 }, slotDate: { color: theme.text, fontSize: scaled(15), fontWeight: '800' }, remove: { borderColor: theme.border, borderRadius: 8, borderWidth: 1, minHeight: 40, justifyContent: 'center', paddingHorizontal: 10 }, removeText: { color: theme.text, fontSize: scaled(13), fontWeight: '800' }, copy: { color: theme.secondaryText, fontSize: scaled(14), lineHeight: scaled(20) }, error: { color: theme.statusColors.negative, marginBottom: 12 }, success: { color: theme.statusColors.positive, marginBottom: 12 }, empty: { flex: 1, justifyContent: 'center', padding: 24 } }); }