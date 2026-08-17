import type { Barber, Service, Studio } from './models';

export const studios: Studio[] = [
  { id: 'northline-studio', name: 'Northline Studio', address: '214 Main Street', distance: '0.7 mi', rating: 4.9 },
  { id: 'blade-room', name: 'The Blade Room', address: '88 East Avenue', distance: '1.2 mi', rating: 4.8 },
  { id: 'crown-and-co', name: 'Crown & Co.', address: '41 Market Street', distance: '1.8 mi', rating: 5 },
];

export const barbers: Barber[] = [
  { id: 'marcus-j', name: 'Marcus J.', studioId: 'northline-studio', specialty: 'Premium fades', rating: 4.9 },
  { id: 'andre-m', name: 'Andre M.', studioId: 'blade-room', specialty: 'Beard sculpting', rating: 4.8 },
  { id: 'jamal-r', name: 'Jamal R.', studioId: 'crown-and-co', specialty: 'Modern taper', rating: 5 },
];

export const services: Service[] = [
  { id: 'skin-fade', name: 'Skin fade', durationMinutes: 30, price: 40 },
  { id: 'beard-trim', name: 'Beard trim', durationMinutes: 20, price: 18 },
  { id: 'classic-taper', name: 'Classic taper', durationMinutes: 25, price: 28 },
];

export function getBarberProfile(id: string) {
  // Accept either a barber id or a studio id so any studio-card link still resolves.
  const barber = barbers.find((item) => item.id === id) ?? barbers.find((item) => item.studioId === id);
  if (!barber) return undefined;
  const studio = studios.find((item) => item.id === barber.studioId);
  return studio ? { barber, studio } : undefined;
}
