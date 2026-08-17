export type Role = 'customer' | 'barber' | 'owner' | 'admin';
export type BookingStatus = 'pending' | 'confirmed' | 'declined' | 'failed' | 'cancelled' | 'completed';

export type User = {
  id: string;
  displayName: string;
  role: Role;
};

export type Studio = {
  id: string;
  name: string;
  address: string;
  distance: string;
  rating: number;
};

export type Barber = {
  id: string;
  name: string;
  studioId: string;
  specialty: string;
  rating: number;
};

export type Service = {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
};

export type AvailabilitySlot = {
  id: string;
  barberId: string;
  startsAt: string;
  available: boolean;
};

export type Booking = {
  id: string;
  serviceId: string;
  serviceName: string;
  barberId: string;
  barberName: string;
  studioId: string;
  studioName: string;
  startsAt: string;
  confirmationCode: string;
  status: BookingStatus;
  price: number;
  cancellationPolicy: string;
};

export type Message = {
  id: string;
  bookingId?: string;
  participantId: string;
  participantName: string;
  body: string;
  sentAt: string;
  unread: boolean;
};

export type PersistedState = {
  version: 1;
  role: Role;
  bookings: Booking[];
  messages: Message[];
  preferences: UserPreferences;
};

export type UserPreferences = {
  darkMode: boolean;
  largeText: boolean;
  accessibilityHints: boolean;
};
