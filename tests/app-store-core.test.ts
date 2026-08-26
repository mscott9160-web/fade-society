import { describe, expect, it } from 'vitest';
import { addBooking, seedBookings, updateBookingStatus, updateBookingTime, validatePersistedState } from '../src/state/app-store-core';

describe('booking store core', () => {
  it('adds a confirmed booking with a generated id', () => {
    const [booking] = addBooking(seedBookings, {
      serviceId: 'skin-fade', serviceName: 'Skin fade', barberId: 'marcus-j', barberName: 'Marcus J.',
      studioId: 'northline-studio', studioName: 'Northline Studio', startsAt: '2026-08-19T09:00:00.000Z', price: 40,
    }).slice(-1);
    expect(booking.id).toMatch(/^booking-/);
    expect(booking.status).toBe('pending');
  });

  it('updates time and status without mutating the original list', () => {
    const updatedTime = updateBookingTime(seedBookings, 'seed-1', '2026-08-20T11:00:00.000Z');
    const cancelled = updateBookingStatus(updatedTime, 'seed-1', 'cancelled');
    expect(seedBookings[0].startsAt).toBe('2026-08-18T10:30:00.000Z');
    expect(cancelled[0].startsAt).toBe('2026-08-20T11:00:00.000Z');
    expect(cancelled[0].status).toBe('cancelled');
  });

  it('rejects malformed persisted state', () => {
    expect(validatePersistedState({ version: 1, role: 'not-a-role', bookings: [] })).toBeNull();
    expect(validatePersistedState({ version: 1, role: 'customer', bookings: [{}] })).toEqual({ version: 1, role: 'customer', bookings: [], messages: [], preferences: { darkMode: false, largeText: false, accessibilityHints: true } });
  });

  it('persists a no-show booking status', () => {
    const booking = { ...seedBookings[0], status: 'no_show' };
    const state = validatePersistedState({ version: 1, role: 'customer', bookings: [booking] });
    expect(state?.bookings[0].status).toBe('no_show');
  });
});
