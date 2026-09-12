import { describe, expect, it } from 'vitest';
import { presentBookingStatus } from '../src/domain/booking-status';
import { updateBookingStatus } from '../src/state/app-store-core';

const booking = {
  id: 'booking-1', serviceId: 'service-1', serviceName: 'Skin fade', barberId: 'barber-1', barberName: 'Morgan',
  studioId: 'studio-1', studioName: 'Northline', startsAt: '2026-08-24T10:00:00Z', confirmationCode: 'FS-TEST',
  status: 'pending' as const, price: 42.5, cancellationPolicy: 'Free cancellation.',
};

describe('booking status presenter', () => {
  it.each(['pending', 'confirmed', 'declined', 'failed', 'cancelled', 'completed', 'no_show'] as const)('presents %s', (status) => {
    const presentation = presentBookingStatus(status);
    expect(presentation.label).toBeTruthy();
    expect(presentation.explanation).toBeTruthy();
    expect(presentation.tone).toBeTruthy();
    expect(presentation.category).toBeTruthy();
  });

  it('keeps no-show in history', () => {
    expect(presentBookingStatus('no_show')).toMatchObject({ label: 'No-show', category: 'history', tone: 'warning' });
  });
});

describe('local booking status transitions', () => {
  it.each([
    ['pending', 'completed'], ['pending', 'no_show'], ['confirmed', 'declined'], ['completed', 'no_show'],
    ['confirmed', 'failed'], ['declined', 'confirmed'], ['failed', 'confirmed'],
    ['completed', 'cancelled'], ['no_show', 'confirmed'],
  ] as const)('rejects %s -> %s', (from, to) => {
    const result = updateBookingStatus([{ ...booking, status: from }], booking.id, to);
    expect(result[0].status).toBe(from);
  });

  it.each([
    ['pending', 'confirmed'], ['pending', 'declined'], ['pending', 'cancelled'], ['confirmed', 'completed'], ['confirmed', 'no_show'],
    ['confirmed', 'cancelled'], ['cancelled', 'confirmed'],
  ] as const)('allows %s -> %s', (from, to) => {
    const result = updateBookingStatus([{ ...booking, status: from }], booking.id, to);
    expect(result[0].status).toBe(to);
  });
});