import { describe, expect, it, vi } from 'vitest';
import { createSupabaseBookingRepository, type BookingClient } from '../src/data/supabase-booking-repository';

type Call = { method: string; args: unknown[] };

function query<Row>(data: Row[] | null, error: Error | null, calls: Call[]) {
  const builder = {
    select: (columns: string) => { calls.push({ method: 'select', args: [columns] }); return builder; },
    eq: (column: string, value: string) => { calls.push({ method: 'eq', args: [column, value] }); return builder; },
    limit: (count: number) => { calls.push({ method: 'limit', args: [count] }); return builder; },
    then: (resolve: (result: { data: Row[] | null; error: Error | null }) => unknown) => Promise.resolve(resolve({ data, error })),
  };
  return builder;
}

function makeClient(rows: unknown[], rpcRows: unknown[] | null = [], rpcError: Error | null = null) {
  const calls: Call[] = [];
  const client = {
    from: vi.fn((table: string) => query(table === 'bookings' ? rows : [], null, calls)),
    rpc: vi.fn((name: string, args: Record<string, unknown>) => {
      calls.push({ method: 'rpc', args: [name, args] });
      return Promise.resolve({ data: rpcRows, error: rpcError });
    }),
  } as unknown as BookingClient;
  return { client, calls };
}

const bookingRow = {
  id: 'booking-1', service_id: 'service-1', barber_id: 'barber-1', studio_id: 'studio-1',
  starts_at: '2026-08-24T10:00:00Z', price_cents: 4250, status: 'no_show',
  services: { name: 'Skin fade' }, barbers: { users: { display_name: 'Morgan' } }, studios: { name: 'Northline' },
};

describe('Supabase booking repository', () => {
  it('maps joined booking DTOs, converts cents, and marks backend-only fields unavailable', async () => {
    const { client, calls } = makeClient([bookingRow]);
    await expect(createSupabaseBookingRepository(client).listMine('caller-id')).resolves.toEqual([{
      id: 'booking-1', serviceId: 'service-1', serviceName: 'Skin fade', barberId: 'barber-1', barberName: 'Morgan',
      studioId: 'studio-1', studioName: 'Northline', startsAt: '2026-08-24T10:00:00Z', confirmationCode: 'Unavailable',
      status: 'no_show', price: 42.5, cancellationPolicy: 'Unavailable',
    }]);
    expect(calls).toContainEqual({ method: 'select', args: ['id, service_id, barber_id, studio_id, starts_at, price_cents, status, services(name), barbers(users(display_name)), studios(name)'] });
    expect(calls).not.toContainEqual({ method: 'eq', args: ['customer_id', 'caller-id'] });
  });

  it('passes the exact create_booking args and hydrates the setof row', async () => {
    const { client, calls } = makeClient([bookingRow], [{ id: 'booking-1' }]);
    await expect(createSupabaseBookingRepository(client).create('caller-id', {
      serviceId: 'service-1', barberId: 'barber-1', startsAt: '2026-08-24T10:00:00Z',
    }, 'idem-1')).resolves.toMatchObject({ id: 'booking-1', serviceName: 'Skin fade' });
    expect(calls).toContainEqual({ method: 'rpc', args: ['create_booking', {
      p_service_id: 'service-1', p_barber_id: 'barber-1', p_starts_at: '2026-08-24T10:00:00Z', p_idempotency_key: 'idem-1',
    }] });
    expect(calls.filter(({ method }) => method === 'select')).toHaveLength(1);
  });

  it.each([
    ['empty RPC response', [], 'Create booking RPC returned no booking'],
    ['multiple RPC rows', [{ id: 'one' }, { id: 'two' }], 'Supabase returned multiple booking rows'],
  ])('rejects %s without a local fallback', async (_label, rpcRows, message) => {
    const { client } = makeClient([bookingRow], rpcRows);
    await expect(createSupabaseBookingRepository(client).create('caller-id', { serviceId: 's', barberId: 'b', startsAt: 't' }, 'key')).rejects.toThrow(message);
  });

  it('propagates RPC and read errors', async () => {
    const rpcError = new Error('rpc failed');
    const { client } = makeClient([], [], rpcError);
    await expect(createSupabaseBookingRepository(client).create('u', { serviceId: 's', barberId: 'b', startsAt: 't' }, 'k')).rejects.toThrow('rpc failed');

    const readError = new Error('read failed');
    const readClient = { from: vi.fn(() => query([], readError, [])), rpc: vi.fn(() => Promise.resolve({ data: [{ id: 'b' }], error: null })) } as unknown as BookingClient;
    await expect(createSupabaseBookingRepository(readClient).create('u', { serviceId: 's', barberId: 'b', startsAt: 't' }, 'k')).rejects.toThrow('read failed');
  });

  it('rejects statuses outside the domain contract', async () => {
    const { client } = makeClient([{ ...bookingRow, status: 'bogus' }]);
    await expect(createSupabaseBookingRepository(client).listMine('u')).rejects.toThrow('Invalid booking status: bogus');
  });

  it('rejects unsupported mutations and missing configuration', async () => {
    const repository = createSupabaseBookingRepository(null);
    await expect(repository.reschedule('u', 'b', 't')).rejects.toThrow('not supported by the backend');
    await expect(repository.cancel('u', 'b')).rejects.toThrow('not supported by the backend');
    await expect(repository.listMine('u')).rejects.toThrow('Supabase is not configured');
  });
});