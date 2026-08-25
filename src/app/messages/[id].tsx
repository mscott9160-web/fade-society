import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '@/state/app-store';
import { useCustomerTheme } from '@/hooks/use-customer-theme';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { messages, sendMessage, markMessagesRead } = useAppStore();
  const theme = useCustomerTheme();
  const [draft, setDraft] = useState('');
  const thread = messages.filter((message) => message.participantId === id);
  const participant = thread[0]?.participantName || 'Studio';
  React.useEffect(() => { if (id) markMessagesRead(id); }, [id, markMessagesRead]);

  function submit() {
    const body = draft.trim();
    if (!body || !id) return;
    sendMessage({ participantId: id, participantName: participant, body });
    setDraft('');
  }

  return <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}><View style={styles.container}><View style={styles.header}><Pressable accessibilityRole="button" accessibilityLabel="Back to messages" accessibilityHint="Returns to your conversations" onPress={() => router.back()} style={styles.headerButton}><Text style={[styles.back, { color: theme.accent }]}>Back</Text></Pressable><Text accessibilityRole="header" style={[styles.title, { color: theme.text, fontSize: 20 * theme.textScale }]}>{participant}</Text><Pressable accessibilityRole="button" accessibilityLabel="Report a problem" accessibilityHint="Opens the report dialog" onPress={() => Alert.alert('Report a problem', 'Support will review this conversation in the production version.')} style={styles.headerButton}><Text style={styles.report}>Report</Text></Pressable></View><ScrollView accessibilityLabel={`Conversation with ${participant}`} contentContainerStyle={styles.thread}>{thread.map((message) => <View key={message.id} accessible accessibilityLabel={`${message.body}, sent at ${new Date(message.sentAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`} style={[styles.message, { backgroundColor: theme.surface }]}><Text style={[styles.body, { color: theme.text, fontSize: 14 * theme.textScale }]}>{message.body}</Text><Text style={[styles.time, { color: theme.secondaryText, fontSize: 11 * theme.textScale }]}>{new Date(message.sentAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text></View>)}</ScrollView><View style={styles.composer}><TextInput accessibilityLabel="Message" accessibilityHint="Type a message to send to this conversation" value={draft} onChangeText={setDraft} placeholder="Write a message" placeholderTextColor={theme.secondaryText} style={[styles.input, { backgroundColor: theme.surface, color: theme.text, fontSize: 14 * theme.textScale }]} /><Pressable accessibilityRole="button" accessibilityLabel="Send message" accessibilityHint="Sends this message" accessibilityState={{ disabled: !draft.trim() }} disabled={!draft.trim()} onPress={submit} style={[styles.send, { backgroundColor: theme.inverseSurface }, !draft.trim() && styles.disabled]}><Text style={[styles.sendText, { color: theme.inverseText, fontSize: 14 * theme.textScale }]}>Send</Text></Pressable></View></View></SafeAreaView>;
}

const styles = StyleSheet.create({ safeArea: { flex: 1, backgroundColor: '#F5F0EA' }, container: { flex: 1, padding: 18 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 }, headerButton: { minWidth: 44, minHeight: 44, justifyContent: 'center' }, title: { color: '#171717', fontSize: 20, fontWeight: '800' }, back: { color: '#8A6A3A', fontWeight: '800' }, report: { color: '#B93A2F', fontWeight: '800' }, thread: { paddingVertical: 18, gap: 10 }, message: { alignSelf: 'flex-start', backgroundColor: '#FFF', borderRadius: 14, padding: 12, maxWidth: '86%' }, body: { color: '#171717' }, time: { color: '#8A8178', fontSize: 11, marginTop: 5 }, composer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 8 }, input: { flex: 1, minHeight: 46, backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 12, color: '#171717' }, send: { minHeight: 46, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#171717' }, sendText: { color: '#FFF', fontWeight: '800' }, disabled: { opacity: 0.45 } });
