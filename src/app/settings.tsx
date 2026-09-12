import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '@/state/app-store';
import { useCustomerTheme } from '@/hooks/use-customer-theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { preferences, updatePreferences, currentUser, signOut } = useAppStore();
  const theme = useCustomerTheme();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  }

  return <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}><ScrollView contentContainerStyle={styles.container}>
    <View style={styles.header}><Pressable accessibilityRole="button" accessibilityLabel="Back to profile" onPress={() => router.back()} style={styles.back}><Text style={[styles.backText, { color: theme.accent }]}>Back</Text></Pressable><Text style={[styles.title, { color: theme.text, fontSize: 22 * theme.textScale }]}>Settings</Text><View style={styles.spacer} /></View>
    <Text style={styles.subtitle}>Customize your Fade Society experience.</Text>
    <View style={[styles.section, { backgroundColor: theme.surface }]}><Text style={[styles.sectionTitle, { color: theme.text, fontSize: 17 * theme.textScale }]}>Appearance</Text><SettingRow label="Dark mode" description="Use a darker color theme throughout the app." value={preferences.darkMode} onValueChange={(value) => updatePreferences({ darkMode: value })} theme={theme} /><SettingRow label="Larger text" description="Increase text sizing for easier reading." value={preferences.largeText} onValueChange={(value) => updatePreferences({ largeText: value })} theme={theme} /></View>
    <View style={styles.section}><Text style={styles.sectionTitle}>Accessibility</Text><SettingRow label="Accessibility hints" description="Include extra spoken guidance on interactive controls." value={preferences.accessibilityHints} onValueChange={(value) => updatePreferences({ accessibilityHints: value })} theme={theme} /><Pressable accessibilityRole="button" accessibilityLabel="VoiceOver instructions" onPress={() => Alert.alert('VoiceOver is controlled by iOS', 'Open iPhone Settings > Accessibility > VoiceOver to turn VoiceOver on or off. Fade Society provides labels and hints for supported controls.')} style={styles.infoRow}><View style={styles.infoCopy}><Text style={styles.rowTitle}>VoiceOver</Text><Text style={styles.rowDescription}>VoiceOver is controlled by your iPhone settings.</Text></View><Text style={styles.link}>Instructions</Text></Pressable></View>
    {currentUser && <View style={styles.section}><Text style={styles.sectionTitle}>Account</Text><Text style={styles.accountEmail}>{currentUser.displayName}</Text><Pressable accessibilityRole="button" accessibilityLabel="Sign out" accessibilityState={{ disabled: signingOut }} disabled={signingOut} onPress={() => void handleSignOut()} style={styles.signOut}><Text style={styles.signOutText}>{signingOut ? 'Signing out...' : 'Sign out'}</Text></Pressable></View>}
  </ScrollView></SafeAreaView>;
}

function SettingRow({ label, description, value, onValueChange, theme }: { label: string; description: string; value: boolean; onValueChange: (value: boolean) => void; theme: ReturnType<typeof useCustomerTheme> }) {
  return <View style={[styles.row, { borderTopColor: theme.border }]}><View style={styles.infoCopy}><Text style={[styles.rowTitle, { color: theme.text, fontSize: 14 * theme.textScale }]}>{label}</Text><Text style={[styles.rowDescription, { color: theme.secondaryText, fontSize: 12 * theme.textScale }]}>{description}</Text></View><Switch accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: value }} value={value} onValueChange={onValueChange} trackColor={{ false: '#D8CEC2', true: theme.accent }} thumbColor={value ? theme.text : '#FFFFFF'} /></View>;
}

const styles = StyleSheet.create({ safeArea: { flex: 1, backgroundColor: '#F5F0EA' }, container: { padding: 18, paddingBottom: 48 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 }, back: { minWidth: 64, minHeight: 44, justifyContent: 'center' }, backText: { color: '#8A6A3A', fontWeight: '800' }, spacer: { minWidth: 64 }, title: { color: '#171717', fontSize: 22, fontWeight: '800' }, subtitle: { color: '#736C62', marginBottom: 12 }, section: { backgroundColor: '#FFF', borderRadius: 18, padding: 16, marginTop: 14 }, sectionTitle: { color: '#171717', fontSize: 17, fontWeight: '800', marginBottom: 8 }, row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F0EAE1' }, infoRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F0EAE1' }, infoCopy: { flex: 1, paddingRight: 12 }, rowTitle: { color: '#171717', fontWeight: '800' }, rowDescription: { color: '#736C62', fontSize: 12, marginTop: 4 }, link: { color: '#8A6A3A', fontWeight: '800' }, accountEmail: { color: '#736C62', marginBottom: 12 }, signOut: { minHeight: 46, borderRadius: 10, backgroundColor: '#171717', alignItems: 'center', justifyContent: 'center' }, signOutText: { color: '#FFF', fontWeight: '800' } });
