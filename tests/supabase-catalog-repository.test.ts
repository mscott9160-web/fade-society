import { describe, expect, it, vi } from 'vitest';
import { createSupabaseCatalogRepository, type CatalogClient } from '../src/data/supabase-catalog-repository';

type QueryCall = { method: string; args: unknown[] };

function createQuery<Row>(data: Row[] | null, error: Error | null, calls: QueryCall[]) {
  const query = {
    select: (columns: string) => { calls.push({ method: 'select', args: [columns] }); return query; },
    eq: (column: string, value: string | boolean) => { calls.push({ method: 'eq', args: [column, value] }); return query; },
    gte: (column: string, value: string) => { calls.push({ method: 'gte', args: [column, value] }); return query; },
    lt: (column: string, value: string) => { calls.push({ method: 'lt', args: [column, value] }); return query; },
    limit: (count: number) => { calls.push({ method: 'limit', args: [count] }); return query; },
    then: (resolve: (result: { data: Row[] | null; error: Error | null }) => unknown) => Promise.resolve(resolve({ data, error })),
  };
  return query;
}

function createClient(rowsByTable: Record<string, unknown[]>, calls: QueryCall[] = [], errorByTable: Record<string, Error> = {}) {
  const client = {
    from: vi.fn((table: string) => createQuery(rowsByTable[table] ?? [], errorByTable[table] ?? null, calls)),
  } as unknown as CatalogClient;
  return { client, calls };
}

describe('Supabase catalog repository', () => {
  it('maps studio rows and marks unavailable live fields without seed values', async () => {
    const { client, calls } = createClient({ studios: [{ id: 'studio-uuid', name: 'Northline', address: '1 Main St' }] });

    await expect(createSupabaseCatalogRepository(client).listStudios()).resolves.toEqual([{
      id: 'studio-uuid', name: 'Northline', address: '1 Main St', distance: 'Unavailable', rating: 0,
    }]);
    expect(calls).toContainEqual({ method: 'select', args: ['id, name, address'] });
  });

  it('filters barbers by active status and optional studio, then maps joined user names', async () => {
    const { client, calls } = createClient({ barbers: [
      { id: 'barber-uuid', studio_id: 'studio-uuid', specialty: null, active: true, users: { display_name: 'Morgan' } },
      { id: 'inactive-uuid', studio_id: 'studio-uuid', specialty: 'Fades', active: false, users: { display_name: 'Inactive' } },
    ] });

    await expect(createSupabaseCatalogRepository(client).listBarbers('studio-uuid')).resolves.toEqual([{
      id: 'barber-uuid', name: 'Morgan', studioId: 'studio-uuid', specialty: 'Not specified', rating: 0,
    }]);
    expect(calls).toContainEqual({ method: 'eq', args: ['active', true] });
    expect(calls).toContainEqual({ method: 'eq', args: ['studio_id', 'studio-uuid'] });
  });

  it('resolves a barber studio before filtering active services and converts cents to dollars', async () => {
    const { client, calls } = createClient({
      barbers: [{ studio_id: 'studio-uuid' }],
      services: [
        { id: 'service-uuid', name: 'Skin fade', duration_minutes: 30, price_cents: 4000, active: true },
        { id: 'inactive-service', name: 'Old cut', duration_minutes: 20, price_cents: 1800, active: false },
      ],
    });

    await expect(createSupabaseCatalogRepository(client).listServices('barber-uuid')).resolves.toEqual([{
      id: 'service-uuid', name: 'Skin fade', durationMinutes: 30, price: 40,
    }]);
    expect(calls).toContainEqual({ method: 'eq', args: ['id', 'barber-uuid'] });
    expect(calls).toContainEqual({ method: 'eq', args: ['studio_id', 'studio-uuid'] });
    expect(calls.filter((call) => call.method === 'eq' && call.args[0] === 'active')).toHaveLength(2);
  });

  it('filters availability by barber, available state, and [from, to) range', async () => {
    const { client, calls } = createClient({ availability_slots: [
      { id: 'slot-uuid', barber_id: 'barber-uuid', starts_at: '2026-08-24T10:00:00Z', available: true },
      { id: 'booked-slot', barber_id: 'barber-uuid', starts_at: '2026-08-24T11:00:00Z', available: false },
    ] });

    await expect(createSupabaseCatalogRepository(client).listAvailability('barber-uuid', '2026-08-24T00:00:00Z', '2026-08-25T00:00:00Z')).resolves.toEqual([{
      id: 'slot-uuid', barberId: 'barber-uuid', startsAt: '2026-08-24T10:00:00Z', available: true,
    }]);
    expect(calls).toContainEqual({ method: 'eq', args: ['barber_id', 'barber-uuid'] });
    expect(calls).toContainEqual({ method: 'eq', args: ['available', true] });
    expect(calls).toContainEqual({ method: 'gte', args: ['starts_at', '2026-08-24T00:00:00Z'] });
    expect(calls).toContainEqual({ method: 'lt', args: ['starts_at', '2026-08-25T00:00:00Z'] });
  });

  it('returns no services when the barber is unavailable', async () => {
    const { client } = createClient({ barbers: [] });

    await expect(createSupabaseCatalogRepository(client).listServices('missing-barber')).resolves.toEqual([]);
  });

  it('propagates Supabase query errors', async () => {
    const error = new Error('catalog unavailable');
    const { client } = createClient({}, [], { studios: error });

    await expect(createSupabaseCatalogRepository(client).listStudios()).rejects.toThrow('catalog unavailable');
  });
});