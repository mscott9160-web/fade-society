import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useAppStore } from '@/state/app-store';

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function daysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function monthLabel(date: Date) {
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function dayLabel(date: Date) {
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function CalendarMonth() {
  const [cursor, setCursor] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const { role, bookings } = useAppStore();

  const start = startOfMonth(cursor);
  const totalDays = daysInMonth(cursor);
  const startWeekday = start.getDay();
  const selectedDate = new Date(cursor.getFullYear(), cursor.getMonth(), selectedDay);
  const displayedBookings = bookings.filter((booking) => {
    const bookingDate = new Date(booking.startsAt);
    return bookingDate.getFullYear() === selectedDate.getFullYear() && bookingDate.getMonth() === selectedDate.getMonth() && bookingDate.getDate() === selectedDate.getDate();
  });

  // Simple availability heat: random-ish deterministic by day
  function heatFor(day: number) {
    const seed = (cursor.getMonth() + 1) * 31 + day;
    const v = Math.abs(Math.sin(seed)) // 0..1-ish
    return Math.round(v * 100) / 100;
  }

  const cells: { day?: number; heat?: number }[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push({});
  for (let d = 1; d <= totalDays; d++) cells.push({ day: d, heat: heatFor(d) });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Previous month" accessibilityHint="Shows the previous month" style={styles.navButton} onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
          <Text style={styles.nav}>{'◀'}</Text>
        </Pressable>
        <View style={styles.titleGroup}>
          <Text style={styles.title}>{monthLabel(cursor)}</Text>
          <Text style={styles.subtitle}>{role === 'owner' ? 'Studio availability' : role === 'barber' ? 'Your schedule' : 'Appointments'}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Next month" accessibilityHint="Shows the next month" style={styles.navButton} onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
          <Text style={styles.nav}>{'▶'}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.weekRow}>
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((w) => (
            <Text key={w} style={styles.weekday}>{w}</Text>
          ))}
        </View>

        <View style={styles.grid}>
          {cells.map((c, i) => (
            <View key={i} style={styles.cell}>
              {c.day ? (
                <Pressable accessibilityRole="button" accessibilityLabel={`${monthLabel(cursor)}, ${c.day}, ${((c.heat || 0) > 0.55) ? 'more availability' : 'less availability'}`} accessibilityState={{ selected: selectedDay === c.day }} onPress={() => setSelectedDay(c.day || 1)} style={[styles.dayBox, { backgroundColor: heatToColor(c.heat || 0) }, selectedDay === c.day && styles.dayBoxSelected]}>
                  <Text style={styles.dayText}>{c.day}</Text>
                  {(c.heat || 0) > 0.55 && <View style={styles.availabilityDot} />}
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
        <View style={styles.legend}>
          <Text style={styles.legendText}>Less open</Text>
          {[0.15, 0.35, 0.55, 0.75, 0.95].map((value) => <View accessible accessibilityLabel={`${value > 0.55 ? 'More' : 'Less'} open`} key={value} style={[styles.legendSwatch, { backgroundColor: heatToColor(value) }]} />)}
          <Text style={styles.legendText}>More open</Text>
        </View>
        <View style={styles.dayPanel}>
          <Text style={styles.panelTitle}>{monthLabel(cursor)} {selectedDay}</Text>
          {displayedBookings.length === 0 ? <Text style={styles.emptyText}>No bookings scheduled for this day.</Text> : displayedBookings.slice(0, 3).map((booking) => (
            <View key={booking.id} style={styles.bookingRow}>
              <View style={styles.bookingDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.bookingTitle}>{booking.serviceName}</Text>
                <Text style={styles.bookingMeta}>{dayLabel(new Date(booking.startsAt))} • {booking.barberName}</Text>
              </View>
              <Text style={styles.bookingStatus}>{booking.status}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function heatToColor(h: number) {
  // h 0..1 => light to intense
  const low = [241, 238, 232];
  const high = [217, 183, 120];
  const r = Math.round(low[0] + (high[0] - low[0]) * h);
  const g = Math.round(low[1] + (high[1] - low[1]) * h);
  const b = Math.round(low[2] + (high[2] - low[2]) * h);
  return `rgb(${r},${g},${b})`;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F0EA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18 },
  title: { fontSize: 20, fontWeight: '800', color: '#171717' },
  titleGroup: { alignItems: 'center' },
  subtitle: { color: '#736C62', fontSize: 11, marginTop: 2 },
  nav: { fontSize: 20, color: '#171717' },
  navButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  container: { paddingHorizontal: 12 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6, marginBottom: 8 },
  weekday: { width: 44, textAlign: 'center', color: '#736C62', fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', padding: 6 },
  dayBox: { borderRadius: 8, alignItems: 'center', justifyContent: 'center', height: 64 },
  dayBoxSelected: { borderWidth: 2, borderColor: '#171717' },
  dayText: { fontWeight: '800', color: '#1F1F1F' },
  availabilityDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#171717', marginTop: 4 },
  legend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 },
  legendText: { color: '#736C62', fontSize: 11 },
  legendSwatch: { width: 14, height: 14, borderRadius: 4 },
  dayPanel: { marginTop: 20, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#E7DCC9' },
  panelTitle: { color: '#171717', fontSize: 16, fontWeight: '800', marginBottom: 12 },
  bookingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F0EAE1' },
  bookingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D9B778', marginRight: 10 },
  bookingTitle: { color: '#171717', fontWeight: '700' },
  bookingMeta: { color: '#736C62', fontSize: 12, marginTop: 3 },
  bookingStatus: { color: '#1E7A4B', fontSize: 11, fontWeight: '700' },
  emptyText: { color: '#736C62' },
});
