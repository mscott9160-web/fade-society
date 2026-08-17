import { describe, expect, it } from 'vitest';
import type { BookingRepository, CatalogRepository, MessageRepository, SessionRepository } from '../src/data/repositories';

describe('Phase 3 repository contracts', () => {
  it('requires booking creation to accept an idempotency key', () => {
    const create: BookingRepository['create'] = async (_userId, _input, idempotencyKey) => ({
      id: idempotencyKey,
      serviceId: 'skin-fade',
      serviceName: 'Skin fade',
      barberId: 'marcus-j',
      barberName: 'Marcus J.',
      studioId: 'northline-studio',
      studioName: 'Northline Studio',
      startsAt: '2026-08-19T09:00:00.000Z',
      confirmationCode: 'FS-CONTRACT',
      status: 'pending',
      price: 40,
      cancellationPolicy: 'Free cancellation up to 24 hours before your appointment.',
    });
    expect(create).toBeTypeOf('function');
  });

  it('keeps catalog, message, and session responsibilities separate', () => {
    const catalog: CatalogRepository = { listStudios: async () => [], listBarbers: async () => [], listServices: async () => [], listAvailability: async () => [] };
    const messages: MessageRepository = { listThreads: async () => [], send: async () => { throw new Error('not implemented'); }, markRead: async () => undefined };
    const session: SessionRepository = { getCurrentUser: async () => null, signOut: async () => undefined, updateRoleForDemo: async (role) => ({ id: 'demo', displayName: 'Demo', role }) };
    expect(catalog.listAvailability).toBeTypeOf('function');
    expect(messages.markRead).toBeTypeOf('function');
    expect(session.getCurrentUser).toBeTypeOf('function');
  });
});
