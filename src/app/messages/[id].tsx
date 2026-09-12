import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '@/state/app-store';
import { useCustomerTheme } from '@/hooks/use-customer-theme';

export default function ConversationScreen() {
  const { id, bookingId } = useLocalSearchParams<{ id?: string; bookingId?: string }>();
  const router = useRouter();
  const { messages, bookings, messageLoading, messageError, sendMessage, markMessagesRead } = useAppStore();
  const theme = useCustomerTheme();
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const thread = messages.filter((message) => message.participantId === id && (!bookingId || message.bookingId === bookingId));
  const participant = thread[0]?.participantName || 'Studio';
  const booking = bookings.find((item) => item.id === bookingId || item.id === thread[0]?.bookingId);

  useEffect(() => { if (id) void markMessagesRead(id); }, [id, markMessagesRead]);

  async function submit() {
    const body = draft.trim();
    if (!body || !id || sending || messageError) return;
    setSendError(null);
    setSending(true);
    try {
      await sendMessage({ participantId: id, participantName: participant, bookingId: booking?.id, body });
      setDraft('');
    } catch (error) {
      setSendError(error instanceof Error ? error.message : String(error));
    } finally {
      setSending(false);
    }
  }

  return <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}><View style={styles.container}><View style={styles.header}><Pressable accessibilityRole="button" accessibilityLabel="Back to messages" onPress={() => router.back()} style={styles.headerButton}><Text style={[styles.back, { color: theme.accent }]}>Back</Text></Pressable><Text accessibilityRole="header" style={[styles.title, { color: theme.text, fontSize: 20 * theme.textScale }]}>{participant}</Text><Pressable accessibilityRole="button" accessibilityLabel="Report a problem" onPress={() => Alert.alert('Report a problem', 'Support will review this conversation in the production version.')} style={styles.headerButton}><Text style={styles.report}>Report</Text></Pressable></View>{booking && <View style={[styles.context, { backgroundColor: theme.surface }]}><Text style={[styles.contextTitle, { color: theme.text }]}>{booking.serviceName}</Text><Text style={[styles.contextText, { color: theme.secondaryText }]}>{booking.studioName} · {new Date(booking.startsAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</Text></View>}{messageLoading && <Text accessibilityRole="alert" style={[styles.state, { color: theme.secondaryText }]}>Loading conversation...</Text>}{messageError && <Text accessibilityRole="alert" style={[styles.state, { color: theme.accent }]}>This conversation is unavailable or you are not authorized to access it.</Text>}{!messageLoading && !messageError && thread.length === 0 && <Text style={[styles.state, { color: theme.secondaryText }]}>No messages yet. Start the conversation about this booking.</Text>}<ScrollView accessibilityLabel={`Conversation with ${participant}`} contentContainerStyle={styles.thread}>{thread.map((message) => <View key={message.id} accessible accessibilityLabel={`${message.body}, sent at ${new Date(message.sentAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`} style={[styles.message, { backgroundColor: theme.surface }]}><Text style={[styles.body, { color: theme.text, fontSize: 14 * theme.textScale }]}>{message.body}</Text><Text style={[styles.time, { color: theme.secondaryText, fontSize: 11 * theme.textScale }]}>{new Date(message.sentAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text></View>)}</ScrollView>{sendError && <Text accessibilityRole="alert" style={[styles.error, { color: theme.accent }]}>Message could not be sent: {sendError}</Text>}<View style={styles.composer}><TextInput accessibilityLabel="Message" value={draft} onChangeText={setDraft} editable={!sending && !messageError} placeholder={sending ? 'Sending...' : 'Write a message'} placeholderTextColor={theme.secondaryText} style={[styles.input, { backgroundColor: theme.surface, color: theme.text, fontSize: 14 * theme.textScale }]} /><Pressable accessibilityRole="button" accessibilityLabel="Send message" disabled={!draft.trim() || sending || Boolean(messageError)} onPress={() => void submit()} style={[styles.send, (!draft.trim() || sending || Boolean(messageError)) && styles.disabled]}><Text style={styles.sendText}>{sending ? 'Sending...' : 'Send'}</Text></Pressable></View></View></SafeAreaView>;
}

const styles = StyleSheet.create({ safeArea: { flex: 1, backgroundColor: '#F5F0EA' }, container: { flex: 1, padding: 18 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 }, headerButton: { minWidth: 44, minHeight: 44, justifyContent: 'center' }, title: { color: '#171717', fontSize: 20, fontWeight: '800' }, back: { color: '#8A6A3A', fontWeight: '800' }, report: { color: '#B93A2F', fontWeight: '800' }, context: { borderRadius: 12, padding: 12, marginTop: 8 }, contextTitle: { fontWeight: '800' }, contextText: { marginTop: 4 }, state: { marginTop: 12 }, thread: { paddingVertical: 18, gap: 10 }, message: { alignSelf: 'flex-start', borderRadius: 14, padding: 12, maxWidth: '86%' }, body: { color: '#171717' }, time: { color: '#8A8178', fontSize: 11, marginTop: 5 }, error: { marginBottom: 8 }, composer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 8 }, input: { flex: 1, minHeight: 46, borderRadius: 12, paddingHorizontal: 12 }, send: { minHeight: 46, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#171717' }, sendText: { color: '#FFF', fontWeight: '800' }, disabled: { opacity: 0.45 } });
