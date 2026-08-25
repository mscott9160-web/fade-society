import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAppStore } from '@/state/app-store';

export default function AuthEntryScreen() {
  const { signIn, signUp } = useAppStore();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      const result = mode === 'signIn'
        ? await signIn({ email: email.trim(), password })
        : await signUp({ email: email.trim(), password, displayName: displayName.trim() || undefined });
      if (result.requiresEmailConfirmation) setMessage('Account created. Check your email to confirm your account, then sign in.');
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : 'Authentication failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return <SafeAreaView style={styles.safeArea}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}><ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled"><Text style={styles.eyebrow}>Fade Society</Text><Text style={styles.title}>{mode === 'signIn' ? 'Welcome back.' : 'Join the Society.'}</Text><Text style={styles.subtitle}>{mode === 'signIn' ? 'Sign in to manage your appointments and messages.' : 'Create an account to book your next cut.'}</Text>
    {mode === 'signUp' && <Field label="Name" value={displayName} onChangeText={setDisplayName} placeholder="Your name" autoComplete="name" />}
    <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" autoComplete="email" keyboardType="email-address" autoCapitalize="none" />
    <Field label="Password" value={password} onChangeText={setPassword} placeholder="Your password" autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'} secureTextEntry />
    {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    {message && <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text>}
    <Pressable accessibilityRole="button" accessibilityLabel={mode === 'signIn' ? 'Sign in' : 'Create account'} accessibilityState={{ disabled: submitting }} disabled={submitting} onPress={() => void submit()} style={styles.primary}>{submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryText}>{mode === 'signIn' ? 'Sign in' : 'Create account'}</Text>}</Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={mode === 'signIn' ? 'Switch to create account' : 'Switch to sign in'} onPress={() => { setMode(mode === 'signIn' ? 'signUp' : 'signIn'); setError(null); setMessage(null); }} style={styles.switch}><Text style={styles.switchText}>{mode === 'signIn' ? 'Need an account? Create one' : 'Already have an account? Sign in'}</Text></Pressable>
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}

function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput accessibilityLabel={label} style={styles.input} {...props} /></View>;
}

const styles = StyleSheet.create({ flex: { flex: 1 }, safeArea: { flex: 1, backgroundColor: '#F5F0EA' }, container: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 48 }, eyebrow: { color: '#8A6A3A', fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }, title: { color: '#171717', fontSize: 34, fontWeight: '800', marginTop: 8 }, subtitle: { color: '#736C62', fontSize: 16, lineHeight: 23, marginTop: 4, marginBottom: 24 }, field: { marginBottom: 14 }, label: { color: '#171717', fontWeight: '800', marginBottom: 6 }, input: { minHeight: 50, borderWidth: 1, borderColor: '#E9DED0', borderRadius: 12, backgroundColor: '#FFF', color: '#171717', paddingHorizontal: 14, fontSize: 16 }, primary: { minHeight: 50, borderRadius: 12, backgroundColor: '#171717', alignItems: 'center', justifyContent: 'center', marginTop: 8 }, primaryText: { color: '#FFF', fontWeight: '800' }, switch: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 8 }, switchText: { color: '#8A6A3A', fontWeight: '800' }, error: { color: '#A33A2B', lineHeight: 20, marginBottom: 8 }, message: { color: '#356B4A', lineHeight: 20, marginBottom: 8 } });