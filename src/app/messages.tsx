import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '@/state/app-store';
import { useCustomerTheme } from '@/hooks/use-customer-theme';
import { getDataMode } from '@/data/supabase-client';

export default function MessagesScreen() {
  const router = useRouter();
  const { messages } = useAppStore();
  const theme = useCustomerTheme();
  const live = getDataMode() === 'supabase';
  const participants = Array.from(new Map(messages.map((message) => [message.participantId, message])).values());

  return <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}><ScrollView contentContainerStyle={styles.container}>
    <Text style={[styles.title, { color: theme.text, fontSize: 32 * theme.textScale }]}>Messages</Text><Text style={[styles.subtitle, { color: theme.secondaryText, fontSize: 14 * theme.textScale }]}>Stay connected to your barber and studio.</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Contact Fade Society support" accessibilityHint="Opens support contact details" onPress={() => Alert.alert('Fade Society support', 'For this demo, contact support at support@fadesociety.example.')} style={[styles.supportCard, { backgroundColor: theme.inverseSurface }]}><Text style={[styles.supportTitle, { color: theme.inverseText, fontSize: 15 * theme.textScale }]}>Need help with a booking?</Text><Text style={[styles.supportText, { color: theme.accent, fontSize: 14 * theme.textScale }]}>Contact Fade Society support</Text></Pressable>
    {live && <Text accessibilityRole="alert" style={[styles.subtitle, { color: theme.secondaryText }]}>Live messaging is unavailable until the messaging service is connected.</Text>}
    {participants.map((message) => <Pressable key={message.participantId} accessibilityRole="button" accessibilityLabel={`Conversation with ${message.participantName}${message.unread ? ', unread' : ''}`} accessibilityHint="Opens this conversation" onPress={() => router.push({ pathname: '/messages/[id]', params: { id: message.participantId } })} style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}><View style={styles.avatar} /><View style={styles.copy}><View style={styles.top}><Text style={[styles.name, { color: theme.text, fontSize: 14 * theme.textScale }]}>{message.participantName}</Text>{message.unread && <Text accessibilityRole="text" style={[styles.unread, { color: theme.accent }]}>Unread</Text>}</View><Text style={[styles.preview, { color: theme.secondaryText, fontSize: 14 * theme.textScale }]}>{message.body}</Text></View></Pressable>)}
    {participants.length === 0 && <View style={styles.empty}><Text style={styles.emptyTitle}>No messages yet</Text><Text style={styles.subtitle}>Your barber or studio will appear here after you book.</Text></View>}
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ safeArea: { flex: 1, backgroundColor: '#F5F0EA' }, container: { padding: 18 }, title: { color: '#171717', fontSize: 32, fontWeight: '800', marginTop: 12 }, subtitle: { color: '#736C62', marginTop: 6, marginBottom: 18 }, supportCard: { backgroundColor: '#171717', borderRadius: 16, padding: 16, marginBottom: 16 }, supportTitle: { color: '#FFF', fontWeight: '800' }, supportText: { color: '#D9B778', marginTop: 5, fontWeight: '700' }, row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#E9DED0', padding: 14, marginBottom: 10, minHeight: 72 }, avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#DAB67A', marginRight: 12 }, copy: { flex: 1 }, top: { flexDirection: 'row', justifyContent: 'space-between' }, name: { color: '#171717', fontWeight: '800' }, unread: { color: '#8A6A3A', fontSize: 10, fontWeight: '800' }, preview: { color: '#736C62', marginTop: 5 }, empty: { backgroundColor: '#FFF', borderRadius: 16, padding: 18, marginTop: 12 }, emptyTitle: { color: '#171717', fontSize: 18, fontWeight: '800' } });
