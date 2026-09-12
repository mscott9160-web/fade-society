import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '@/state/app-store';
import { useCustomerTheme } from '@/hooks/use-customer-theme';
import type { ProviderAvailabilitySlot } from '@/domain/models';
import { getErrorMessage } from '@/domain/error';

const PROVIDER_ROLES = ['barber', 'owner', 'admin'];
const DAY_COUNT = 14;

function formatDate(value: Date) { return value.toLocaleDateString([], { dateStyle: 'medium' }); }
function formatTime(value: Date) { return value.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
function getTimezone() { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'local timezone'; }
function localDateKey(value: Date) { return `${value.getFullYear()}-${value.getMonth() + 1}-${value.getDate()}`; }

export default function AvailabilityScreen() {
  const router = useRouter();
  const theme = useCustomerTheme();
  const styles = createStyles(theme);
  const { role, currentUser, barbers, studios, listProviderSlots, addProviderSlot, removeProviderSlot } = useAppStore();
  const providerAccess = PROVIDER_ROLES.includes(role);
  const [selectedBarberId, setSelectedBarberId] = useState<string | undefined>(role === 'barber' ? currentUser?.id : barbers[0]?.id);
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(() => new Date(Date.now() + 60 * 60 * 1000));
  const [picker, setPicker] = useState<'date' | 'start' | 'end' | null>(null);
  const [slots, setSlots] = useState<ProviderAvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const activeBarberId = role === 'barber' ? currentUser?.id : selectedBarberId ?? barbers[0]?.id;
  const studio = studios.find((item) => item.id === barbers.find((barber) => barber.id === activeBarberId)?.studioId);
  const timezone = studio && 'timezone' in studio && typeof studio.timezone === 'string' ? studio.timezone : getTimezone();
  const range = useMemo(() => { const from = new Date(); const to = new Date(from); to.setDate(to.getDate() + DAY_COUNT); return { from: from.toISOString(), to: to.toISOString() }; }, []);

  const loadSlots = useCallback(async () => {
    if (!providerAccess || !currentUser || !activeBarberId) return;
    setLoading(true);
    setError(null);
    try { setSlots(await listProviderSlots(activeBarberId, range.from, range.to)); }
    catch (cause: unknown) { setError(getErrorMessage(cause, 'Availability could not be loaded. Please try again.')); }
    finally { setLoading(false); }
  }, [activeBarberId, currentUser, listProviderSlots, providerAccess, range.from, range.to]);

  useEffect(() => { const timer = setTimeout(() => { void loadSlots(); }, 0); return () => clearTimeout(timer); }, [loadSlots]);

  function onPickerChange(event: DateTimePickerEvent, value?: Date) {
    const currentPicker = picker;
    setPicker(null);
    if (event.type === 'dismissed' || !value) return;
    if (currentPicker === 'date') setDate(value);
    if (currentPicker === 'start') setStartTime(value);
    if (currentPicker === 'end') setEndTime(value);
  }

  async function addSlot() {
    setError(null); setMessage(null);
    if (!currentUser || !activeBarberId) { setError('Select a barber before adding availability.'); return; }
    const startsAt = new Date(date); startsAt.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
    const endsAt = new Date(date); endsAt.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
    if (startsAt <= new Date() || startsAt >= endsAt) { setError('Choose a future slot with an end time after the start time.'); return; }
    setSubmitting(true);
    try {
      const slot = await addProviderSlot(activeBarberId, startsAt.toISOString(), endsAt.toISOString());
      setSlots((current) => [...current, slot].sort((left, right) => left.startsAt.localeCompare(right.startsAt)));
      setMessage('Availability added.');
    } catch (cause: unknown) { setError(getErrorMessage(cause, 'Availability could not be added. Please try again.')); }
    finally { setSubmitting(false); }
  }

  function confirmRemove(slot: ProviderAvailabilitySlot) {
    Alert.alert('Remove availability?', `${formatDate(new Date(slot.startsAt))}, ${formatTime(new Date(slot.startsAt))} to ${formatTime(new Date(slot.endsAt))}`, [
      { text: 'Keep slot', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => { void removeSlot(slot); } },
    ]);
  }

  async function removeSlot(slot: ProviderAvailabilitySlot) {
    setError(null); setMessage(null); setRemovingId(slot.id);
    try { await removeProviderSlot(slot.id); setSlots((current) => current.filter((item) => item.id !== slot.id)); setMessage('Availability removed.'); }
    catch (cause: unknown) { setError(getErrorMessage(cause, 'Availability could not be removed. Please try again.')); }
    finally { setRemovingId(null); }
  }

  if (!providerAccess) return <SafeAreaView style={styles.safeArea}><View style={styles.empty}><Text style={styles.title}>Provider access required</Text><Text style={styles.copy}>Sign in with a barber, owner, or admin account to manage availability.</Text></View></SafeAreaView>;

  const groups = slots.reduce<Record<string, ProviderAvailabilitySlot[]>>((result, slot) => { const key = localDateKey(new Date(slot.startsAt)); (result[key] ??= []).push(slot); return result; }, {});
  const pickerButton = (label: string, value: string, kind: 'date' | 'start' | 'end') => <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => setPicker(kind)} style={styles.input}><Text style={styles.inputText}>{value}</Text></Pressable>;

  return <SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.container}>
    <Pressable accessibilityRole="button" accessibilityLabel="Back to Today" onPress={() => router.back()}><Text style={styles.back}>Back to Today</Text></Pressable>
    <Text style={styles.eyebrow}>Provider schedule</Text><Text style={styles.title}>Availability</Text><Text style={styles.subtitle}>Your next {DAY_COUNT} days of appointment slots.</Text><Text accessibilityLabel={`Provider timezone ${timezone}`} style={styles.zone}>Times shown in {timezone}</Text>
    {(error || message) && <Text accessibilityRole="alert" style={error ? styles.error : styles.success}>{error ?? message}</Text>}
    {error && !loading && <Pressable accessibilityRole="button" accessibilityLabel="Retry loading availability" onPress={() => { void loadSlots(); }} style={styles.retry}><Text style={styles.retryText}>Retry</Text></Pressable>}
    {role !== 'barber' && <><Text style={styles.sectionTitle}>Barber</Text><View style={styles.barberList}>{barbers.map((barber) => <Pressable key={barber.id} accessibilityRole="button" accessibilityState={{ selected: activeBarberId === barber.id }} onPress={() => { setSelectedBarberId(barber.id); setSlots([]); setError(null); }} style={[styles.barber, activeBarberId === barber.id && styles.barberActive]}><Text style={[styles.barberText, activeBarberId === barber.id && styles.barberTextActive]}>{barber.name}</Text></Pressable>)}</View></>}
    <View style={styles.form}><Text style={styles.sectionTitle}>Add a future slot</Text>{pickerButton('Slot date', formatDate(date), 'date')}{pickerButton('Slot start time', formatTime(startTime), 'start')}{pickerButton('Slot end time', formatTime(endTime), 'end')}{picker && <DateTimePicker accessibilityLabel="Availability picker" value={picker === 'date' ? date : picker === 'start' ? startTime : endTime} mode={picker === 'date' ? 'date' : 'time'} onChange={onPickerChange} />}<Pressable accessibilityRole="button" accessibilityState={{ disabled: submitting, busy: submitting }} disabled={submitting} onPress={() => { void addSlot(); }} style={styles.primary}><Text style={styles.primaryText}>{submitting ? 'Adding...' : 'Add slot'}</Text></Pressable></View>
    <Text style={styles.sectionTitle}>Upcoming slots</Text>{loading ? <Text style={styles.copy}>Loading availability...</Text> : Object.keys(groups).length === 0 ? <Text style={styles.copy}>No availability in the next {DAY_COUNT} days.</Text> : Object.entries(groups).map(([key, group]) => <View key={key}><Text style={styles.day}>{formatDate(new Date(group[0].startsAt))}</Text>{group.map((slot) => <View key={slot.id} style={styles.slot}><View style={styles.slotText}><Text style={styles.slotDate}>{formatTime(new Date(slot.startsAt))} - {formatTime(new Date(slot.endsAt))}</Text><Text style={styles.copy}>{slot.available ? 'Open for booking' : 'Unavailable'}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={`Remove slot on ${formatDate(new Date(slot.startsAt))} at ${formatTime(new Date(slot.startsAt))}`} accessibilityState={{ disabled: removingId === slot.id, busy: removingId === slot.id }} disabled={removingId === slot.id || !slot.available} onPress={() => confirmRemove(slot)} style={styles.remove}><Text style={styles.removeText}>{removingId === slot.id ? 'Removing...' : 'Remove'}</Text></Pressable></View>)}</View>)}
  </ScrollView></SafeAreaView>;
}

function createStyles(theme: ReturnType<typeof useCustomerTheme>) {
  const scaled = (size: number) => size * theme.textScale;
  return StyleSheet.create({ safeArea: { flex: 1, backgroundColor: theme.background }, container: { padding: 18, paddingBottom: 48 }, empty: { flex: 1, justifyContent: 'center', padding: 24 }, back: { color: theme.accent, fontWeight: '800', marginBottom: 24 }, eyebrow: { color: theme.accent, fontSize: scaled(12), fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }, title: { color: theme.text, fontSize: scaled(32), fontWeight: '800', marginTop: 6 }, subtitle: { color: theme.secondaryText, fontSize: scaled(15), marginTop: 4, marginBottom: 4 }, zone: { color: theme.secondaryText, fontSize: scaled(13), marginBottom: 18 }, sectionTitle: { color: theme.text, fontSize: scaled(19), fontWeight: '800', marginBottom: 10, marginTop: 18 }, barberList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 }, barber: { borderColor: theme.border, borderRadius: 9, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 }, barberActive: { backgroundColor: theme.inverseSurface, borderColor: theme.inverseSurface }, barberText: { color: theme.text, fontSize: scaled(14), fontWeight: '700' }, barberTextActive: { color: theme.inverseText }, form: { backgroundColor: theme.surface, borderColor: theme.border, borderRadius: 14, borderWidth: 1, padding: 16 }, input: { borderColor: theme.border, borderRadius: 9, borderWidth: 1, justifyContent: 'center', minHeight: 46, marginBottom: 10, paddingHorizontal: 12 }, inputText: { color: theme.text, fontSize: scaled(14) }, primary: { alignItems: 'center', backgroundColor: theme.inverseSurface, borderRadius: 10, justifyContent: 'center', minHeight: 46, marginTop: 2 }, primaryText: { color: theme.inverseText, fontWeight: '800' }, retry: { borderColor: theme.border, borderRadius: 9, borderWidth: 1, justifyContent: 'center', minHeight: 44, marginBottom: 10, paddingHorizontal: 12 }, retryText: { color: theme.text, fontWeight: '800', textAlign: 'center' }, day: { color: theme.text, fontSize: scaled(17), fontWeight: '800', marginTop: 8 }, slot: { alignItems: 'center', backgroundColor: theme.surface, borderColor: theme.border, borderRadius: 12, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, padding: 14 }, slotText: { flex: 1, minWidth: 0 }, slotDate: { color: theme.text, fontSize: scaled(15), fontWeight: '800' }, remove: { borderColor: theme.border, borderRadius: 8, borderWidth: 1, justifyContent: 'center', minHeight: 40, paddingHorizontal: 10 }, removeText: { color: theme.text, fontSize: scaled(13), fontWeight: '800' }, copy: { color: theme.secondaryText, fontSize: scaled(14), lineHeight: scaled(20) }, error: { color: theme.statusColors.negative, marginBottom: 10 }, success: { color: theme.statusColors.positive, marginBottom: 10 } });
}
