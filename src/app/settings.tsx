import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '@/state/app-store';

export default function SettingsScreen() {
  const router = useRouter();
  const { preferences, updatePreferences } = useAppStore();

  return <SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.container}>
    <View style={styles.header}><Pressable accessibilityRole="button" accessibilityLabel="Back to profile" onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>Back</Text></Pressable><Text style={styles.title}>Settings</Text><View style={styles.spacer} /></View>
    <Text style={styles.subtitle}>Customize your Fade Society experience.</Text>
    <View style={styles.section}><Text style={styles.sectionTitle}>Appearance</Text><SettingRow label="Dark mode" description="Use a darker color theme throughout the app." value={preferences.darkMode} onValueChange={(value) => updatePreferences({ darkMode: value })} /><SettingRow label="Larger text" description="Increase text sizing for easier reading." value={preferences.largeText} onValueChange={(value) => updatePreferences({ largeText: value })} /></View>
    <View style={styles.section}><Text style={styles.sectionTitle}>Accessibility</Text><SettingRow label="Accessibility hints" description="Include extra spoken guidance on interactive controls." value={preferences.accessibilityHints} onValueChange={(value) => updatePreferences({ accessibilityHints: value })} /><Pressable accessibilityRole="button" accessibilityLabel="VoiceOver instructions" onPress={() => Alert.alert('VoiceOver is controlled by iOS', 'Open iPhone Settings > Accessibility > VoiceOver to turn VoiceOver on or off. Fade Society provides labels and hints for supported controls.')} style={styles.infoRow}><View style={styles.infoCopy}><Text style={styles.rowTitle}>VoiceOver</Text><Text style={styles.rowDescription}>VoiceOver is controlled by your iPhone settings.</Text></View><Text style={styles.link}>Instructions</Text></Pressable></View>
  </ScrollView></SafeAreaView>;
}

function SettingRow({ label, description, value, onValueChange }: { label: string; description: string; value: boolean; onValueChange: (value: boolean) => void }) {
  return <View style={styles.row}><View style={styles.infoCopy}><Text style={styles.rowTitle}>{label}</Text><Text style={styles.rowDescription}>{description}</Text></View><Switch accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: value }} value={value} onValueChange={onValueChange} trackColor={{ false: '#D8CEC2', true: '#B89A65' }} thumbColor={value ? '#171717' : '#FFFFFF'} /></View>;
}

const styles = StyleSheet.create({ safeArea: { flex: 1, backgroundColor: '#F5F0EA' }, container: { padding: 18, paddingBottom: 48 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 }, back: { minWidth: 64, minHeight: 44, justifyContent: 'center' }, backText: { color: '#8A6A3A', fontWeight: '800' }, spacer: { minWidth: 64 }, title: { color: '#171717', fontSize: 22, fontWeight: '800' }, subtitle: { color: '#736C62', marginBottom: 12 }, section: { backgroundColor: '#FFF', borderRadius: 18, padding: 16, marginTop: 14 }, sectionTitle: { color: '#171717', fontSize: 17, fontWeight: '800', marginBottom: 8 }, row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F0EAE1' }, infoRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F0EAE1' }, infoCopy: { flex: 1, paddingRight: 12 }, rowTitle: { color: '#171717', fontWeight: '800' }, rowDescription: { color: '#736C62', fontSize: 12, marginTop: 4 }, link: { color: '#8A6A3A', fontWeight: '800' }, demoText: { color: '#736C62', lineHeight: 20 }, roles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }, role: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 10, backgroundColor: '#F4F1EA' }, roleActive: { backgroundColor: '#171717' }, roleText: { color: '#736C62', fontWeight: '800' }, roleTextActive: { color: '#FFF' } });
