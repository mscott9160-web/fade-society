import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getBarberProfile, services as localServices } from '@/domain/catalog';
import { formatBookingDate, groupBookingTimes, makeSlotDate } from '@/domain/date';
import { useAppStore } from '@/state/app-store';
import type { Service } from '@/domain/models';
import { getDataMode } from '@/data/supabase-client';

type Step = 'profile' | 'service' | 'time' | 'review';

export default function BookScreen() {
	const { barberId } = useLocalSearchParams<{ barberId?: string }>();
	const router = useRouter();
	const { bookings, addBooking, createBooking, listServices, listAvailability, barbers, studios, catalogLoading, catalogError } = useAppStore();
	const live = getDataMode() === 'supabase';
	const localProfile = barberId ? getBarberProfile(barberId) : undefined;
	const liveBarber = barberId ? barbers.find((item) => item.id === barberId) : undefined;
	const liveStudio = liveBarber ? studios.find((item) => item.id === liveBarber.studioId) : undefined;
	const profile = live ? (liveBarber && liveStudio ? { barber: liveBarber, studio: liveStudio } : undefined) : localProfile;
	const [step, setStep] = useState<Step>('profile');
	const [selectedService, setSelectedService] = useState<Service | null>(null);
	const [selectedTime, setSelectedTime] = useState('');
	const [availableServices, setAvailableServices] = useState<Service[]>(live ? [] : localServices);
	const [times, setTimes] = useState<string[]>(live ? [] : [9, 11, 13, 15, 17].flatMap((hour) => [0, 1].map((day) => makeSlotDate(day, hour))));
	const [loading, setLoading] = useState(live);
	const [error, setError] = useState<string | null>(null);
	const [confirming, setConfirming] = useState(false);
	const [idempotencyKey] = useState(() => `booking-${Date.now()}-${Math.random().toString(36).slice(2)}`);
	const reserved = new Set(bookings.filter((booking) => booking.barberId === barberId && booking.status !== 'cancelled').map((booking) => booking.startsAt));

	useEffect(() => {
		if (!live || !barberId) return;
		let active = true;
		const from = new Date().toISOString();
		const to = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();
		Promise.all([listServices(barberId), listAvailability(barberId, from, to)])
			.then(([nextServices, nextAvailability]) => { if (active) { setAvailableServices(nextServices); setTimes(nextAvailability.filter((slot) => slot.available).map((slot) => slot.startsAt)); } })
			.catch((nextError: unknown) => { if (active) setError(nextError instanceof Error ? nextError.message : String(nextError)); })
			.finally(() => { if (active) setLoading(false); });
		return () => { active = false; };
	}, [barberId, listAvailability, listServices, live]);

	if (!profile) {
		return <SafeAreaView style={styles.safeArea}><View style={styles.empty}><Text style={styles.title}>Barber profile unavailable</Text><Text style={styles.copy}>This studio could not be loaded. Return to Find and choose another profile.</Text><Pressable accessibilityRole="button" onPress={() => router.replace('/find')} style={styles.primary}><Text style={styles.primaryText}>Back to Find</Text></Pressable></View></SafeAreaView>;
	}
	const currentProfile = profile;
	const groupedTimes = groupBookingTimes(times);

	function chooseService(service: Service) {
		setSelectedService(service);
		setSelectedTime('');
		setStep('time');
	}

	async function confirm() {
		if (!selectedService || !selectedTime) return;
		setConfirming(true);
		setError(null);
		try {
			if (!live) {
				const id = addBooking({ serviceId: selectedService.id, serviceName: selectedService.name, barberId: currentProfile.barber.id, barberName: currentProfile.barber.name, studioId: currentProfile.studio.id, studioName: currentProfile.studio.name, startsAt: selectedTime, price: selectedService.price });
				router.replace({ pathname: '/confirmation/[id]', params: { id } });
				return;
			}
			const booking = await createBooking({ serviceId: selectedService.id, barberId: currentProfile.barber.id, startsAt: selectedTime }, idempotencyKey);
			router.replace({ pathname: '/confirmation/[id]', params: { id: booking.id } });
		} catch (nextError) {
			setError(nextError instanceof Error ? nextError.message : String(nextError));
		} finally {
			setConfirming(false);
		}
	}

	return <SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.container}>
		<Pressable accessibilityRole="button" onPress={() => router.replace('/find')} style={styles.back}><Text style={styles.link}>Back to Find</Text></Pressable>
		<View style={styles.profile}><View style={styles.avatar} /><Text style={[styles.title, styles.profileTitle]}>{profile.barber.name}</Text><Text style={[styles.meta, styles.profileMeta]}>{profile.studio.name} • {profile.barber.rating > 0 ? `${profile.barber.rating} stars` : 'Rating unavailable'}</Text><Text style={[styles.meta, styles.profileMeta]}>{profile.studio.address} • {profile.studio.distance || 'Distance unavailable'}</Text><Text style={styles.specialty}>{profile.barber.specialty}</Text></View>

		{catalogLoading || loading ? <Text style={styles.copy}>Loading live services and availability...</Text> : error || catalogError ? <Text accessibilityRole="alert" style={styles.copy}>{error ?? catalogError}</Text> : <>{step === 'profile' && <><Text style={styles.sectionTitle}>Services</Text>{availableServices.length === 0 ? <Text style={styles.copy}>No services are available for this barber.</Text> : availableServices.map((service) => <Pressable key={service.id} accessibilityRole="button" accessibilityLabel={`Choose ${service.name}, ${service.durationMinutes} minutes, $${service.price}`} onPress={() => chooseService(service)} style={styles.row}><View><Text style={styles.rowTitle}>{service.name}</Text><Text style={styles.meta}>{service.durationMinutes} minutes</Text></View><Text style={styles.price}>${service.price}</Text></Pressable>)}</>}</>}
		{step === 'service' && <Text style={styles.sectionTitle}>Choose a service</Text>}
			{step === 'time' && <><Text style={styles.sectionTitle}>Choose a time</Text><Text style={styles.copy}>Select an available appointment for {selectedService?.name}.</Text>{groupedTimes.length === 0 ? <Text style={styles.copy}>No availability is currently listed.</Text> : groupedTimes.map((group) => <View key={group.date}><Text style={styles.meta}>{group.label}</Text><View style={styles.grid}>{group.times.map(({ value, label }) => { const taken = !live && reserved.has(value); return <Pressable key={value} disabled={taken} accessibilityRole="button" accessibilityState={{ selected: selectedTime === value, disabled: taken }} onPress={() => setSelectedTime(value)} style={[styles.timeButton, selectedTime === value && styles.active, taken && styles.taken]}><Text style={[styles.timeText, selectedTime === value && styles.activeText]}>{label}{taken ? ' (Taken)' : ''}</Text></Pressable>; })}</View></View>)}</>}
			{step === 'review' && selectedService && <View><Text style={styles.sectionTitle}>Review appointment</Text><View style={styles.review}><Text style={styles.rowTitle}>{selectedService.name}</Text><Text style={styles.meta}>{selectedService.durationMinutes} minutes</Text><Text style={styles.meta}>{formatBookingDate(selectedTime)}</Text><Text style={styles.meta}>{profile.studio.name} • {profile.studio.address}</Text><Text style={styles.price}>${selectedService.price}</Text></View></View>}

		<View style={styles.actions}>{step === 'profile' ? null : <Pressable accessibilityRole="button" onPress={() => setStep(step === 'review' ? 'time' : step === 'time' ? 'profile' : 'profile')} style={styles.secondary}><Text style={styles.secondaryText}>Back</Text></Pressable>}{step === 'time' && <Pressable accessibilityRole="button" disabled={!selectedTime} onPress={() => setStep('review')} style={[styles.primary, !selectedTime && styles.disabled]}><Text style={styles.primaryText}>Review booking</Text></Pressable>}{step === 'review' && <Pressable accessibilityRole="button" disabled={confirming} onPress={() => void confirm()} style={[styles.primary, confirming && styles.disabled]}><Text style={styles.primaryText}>{confirming ? 'Sending...' : 'Confirm request'}</Text></Pressable>}</View>
	</ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: '#F5F0EA' }, container: { padding: 18, paddingBottom: 50 }, back: { minHeight: 44, justifyContent: 'center' }, link: { color: '#8A6A3A', fontWeight: '800' }, profile: { backgroundColor: '#171717', borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 20 }, avatar: { width: 74, height: 74, borderRadius: 37, backgroundColor: '#D9B778', marginBottom: 12 }, title: { color: '#171717', fontSize: 26, fontWeight: '800', textAlign: 'center' }, profileTitle: { color: '#FFF' }, meta: { color: '#736C62', marginTop: 5 }, profileMeta: { color: '#D4CCC4' }, specialty: { color: '#D9B778', fontWeight: '800', marginTop: 12 }, profileSpecialty: { marginTop: 0, marginBottom: 8 }, sectionTitle: { color: '#171717', fontSize: 20, fontWeight: '800', marginBottom: 12 }, row: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, minHeight: 64 }, rowTitle: { color: '#171717', fontWeight: '800', fontSize: 16 }, price: { color: '#171717', fontWeight: '800', fontSize: 16 }, copy: { color: '#736C62', lineHeight: 20, marginBottom: 12 }, grid: { gap: 8 }, timeButton: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, minHeight: 52, justifyContent: 'center' }, timeText: { color: '#171717', fontWeight: '700' }, active: { backgroundColor: '#171717' }, activeText: { color: '#FFF' }, taken: { opacity: 0.4 }, review: { backgroundColor: '#FFF', borderRadius: 16, padding: 18, gap: 6 }, policy: { color: '#8C4A1D', backgroundColor: '#FCE7D5', padding: 10, borderRadius: 10, marginTop: 10 }, actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 20 }, primary: { minHeight: 48, paddingHorizontal: 18, borderRadius: 12, backgroundColor: '#171717', alignItems: 'center', justifyContent: 'center' }, primaryText: { color: '#FFF', fontWeight: '800' }, secondary: { minHeight: 48, paddingHorizontal: 18, borderRadius: 12, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' }, secondaryText: { color: '#171717', fontWeight: '800' }, disabled: { opacity: 0.45 }, empty: { padding: 24 },
});
