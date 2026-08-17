import type { Booking, BookingStatus, Message, PersistedState, Role, UserPreferences } from '@/domain/models';

export const seedBookings: Booking[] = [
  {
    id: 'seed-1',
    serviceId: 'classic-taper',
    serviceName: 'Classic taper',
    barberId: 'marcus-j',
    barberName: 'Marcus J.',
    studioId: 'northline-studio',
    studioName: 'Northline Studio',
    startsAt: '2026-08-18T10:30:00.000Z',
    confirmationCode: 'FS-DEMO01',
    status: 'confirmed',
    price: 40,
    cancellationPolicy: 'Free cancellation up to 24 hours before your appointment.',
  },
];

export const seedMessages: Message[] = [
  { id: 'message-1', participantId: 'marcus-j', participantName: 'Marcus J.', body: 'Your appointment request is ready to review.', sentAt: '2026-08-16T14:00:00.000Z', unread: true },
];

export const defaultPreferences: UserPreferences = { darkMode: false, largeText: false, accessibilityHints: true };

export function isRole(value: unknown): value is Role {
  return value === 'customer' || value === 'barber' || value === 'owner' || value === 'admin';
}

export function isBookingStatus(value: unknown): value is BookingStatus {
  return value === 'pending' || value === 'confirmed' || value === 'declined' || value === 'failed' || value === 'cancelled' || value === 'completed';
}

export function validatePersistedState(value: unknown): PersistedState | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<PersistedState>;
  if (candidate.version !== 1 || !isRole(candidate.role) || !Array.isArray(candidate.bookings)) return null;
  const bookings = candidate.bookings.filter((booking): booking is Booking => (
    Boolean(booking) &&
    typeof booking === 'object' &&
    typeof booking.id === 'string' &&
    typeof booking.serviceId === 'string' &&
    typeof booking.serviceName === 'string' &&
    typeof booking.barberId === 'string' &&
    typeof booking.barberName === 'string' &&
    typeof booking.studioId === 'string' &&
    typeof booking.studioName === 'string' &&
    typeof booking.startsAt === 'string' &&
    typeof booking.confirmationCode === 'string' &&
    isBookingStatus(booking.status) &&
    typeof booking.price === 'number' &&
    Number.isFinite(booking.price) &&
    typeof booking.cancellationPolicy === 'string'
  ));
  const messages = (candidate.messages || []).filter((message): message is Message => Boolean(message) && typeof message === 'object' && typeof message.id === 'string' && typeof message.participantId === 'string' && typeof message.participantName === 'string' && typeof message.body === 'string' && typeof message.sentAt === 'string' && typeof message.unread === 'boolean');
  const preferences = candidate.preferences && typeof candidate.preferences === 'object'
    ? { ...defaultPreferences, ...(candidate.preferences as Partial<UserPreferences>) }
    : defaultPreferences;
  return { version: 1, role: candidate.role, bookings, messages, preferences };
}

export function appendMessage(messages: Message[], message: Omit<Message, 'id' | 'sentAt' | 'unread'>): Message[] {
  return [...messages, { ...message, id: `message-${Date.now()}`, sentAt: new Date().toISOString(), unread: false }];
}

export function markMessagesRead(messages: Message[], participantId: string): Message[] {
  return messages.map((message) => message.participantId === participantId ? { ...message, unread: false } : message);
}

export function addBooking(bookings: Booking[], booking: Omit<Booking, 'id' | 'status' | 'confirmationCode' | 'cancellationPolicy'> & Partial<Pick<Booking, 'cancellationPolicy'>>): Booking[] {
  const confirmationCode = `FS-${Date.now().toString(36).slice(-6).toUpperCase()}`;
  return [...bookings, { ...booking, id: `booking-${Date.now()}`, confirmationCode, status: 'pending', cancellationPolicy: booking.cancellationPolicy || 'Free cancellation up to 24 hours before your appointment.' }];
}

export function updateBookingStatus(bookings: Booking[], id: string, status: BookingStatus): Booking[] {
  return bookings.map((booking) => {
    if (booking.id !== id) return booking;
    const allowed = booking.status === 'pending' && ['confirmed', 'cancelled', 'declined', 'failed'].includes(status)
      || booking.status === 'confirmed' && ['completed', 'cancelled'].includes(status)
      || booking.status === 'cancelled' && status === 'confirmed';
    return allowed ? { ...booking, status } : booking;
  });
}

export function updateBookingTime(bookings: Booking[], id: string, startsAt: string): Booking[] {
  return bookings.map((booking) => booking.id === id ? { ...booking, startsAt } : booking);
}
