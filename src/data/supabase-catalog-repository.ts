import type { AvailabilitySlot, Barber, Service, Studio } from '@/domain/models';
import type { CatalogRepository } from './repositories';
import { getSupabaseClient } from './supabase-client';

type QueryResult<Row> = {
  data: Row[] | null;
  error: Error | null;
};

type CatalogQuery<Row> = PromiseLike<QueryResult<Row>> & {
  select: (columns: string) => CatalogQuery<Row>;
  eq: (column: string, value: string | boolean) => CatalogQuery<Row>;
  gte: (column: string, value: string) => CatalogQuery<Row>;
  lt: (column: string, value: string) => CatalogQuery<Row>;
  limit: (count: number) => CatalogQuery<Row>;
};

export type CatalogClient = {
  from: <Row>(table: string) => CatalogQuery<Row>;
};

type StudioRow = {
  id: string;
  name: string;
  address: string;
};

type BarberRow = {
  id: string;
  studio_id: string;
  specialty: string | null;
  active: boolean;
  users: { display_name: string } | { display_name: string }[] | null;
};

type ServiceRow = {
  id: string;
  name: string;
  duration_minutes: number;
  price_cents: number;
  active: boolean;
};

type BarberStudioRow = {
  studio_id: string;
};

type AvailabilityRow = {
  id: string;
  barber_id: string;
  starts_at: string;
  available: boolean;
};

function requireClient(client: CatalogClient | null): CatalogClient {
  if (!client) throw new Error('Supabase is not configured');
  return client;
}

function throwIfError(error: Error | null): void {
  if (error) throw error;
}

function getDisplayName(users: BarberRow['users']): string {
  const user = Array.isArray(users) ? users[0] : users;
  return user?.display_name ?? 'Unnamed barber';
}

function mapStudio(row: StudioRow): Studio {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    // Distance and rating are not stored in the current schema; do not use local seed values here.
    distance: 'Unavailable',
    rating: 0,
  };
}

function mapBarber(row: BarberRow): Barber {
  return {
    id: row.id,
    name: getDisplayName(row.users),
    studioId: row.studio_id,
    specialty: row.specialty ?? 'Not specified',
    // Ratings are not stored in the current schema; zero means unavailable, not a live rating.
    rating: 0,
  };
}

function mapService(row: ServiceRow): Service {
  return {
    id: row.id,
    name: row.name,
    durationMinutes: row.duration_minutes,
    price: row.price_cents / 100,
  };
}

function mapAvailability(row: AvailabilityRow): AvailabilitySlot {
  return {
    id: row.id,
    barberId: row.barber_id,
    startsAt: row.starts_at,
    available: row.available,
  };
}

export function createSupabaseCatalogRepository(client?: CatalogClient | null): CatalogRepository {
  const configuredClient = client === undefined ? getSupabaseClient() as unknown as CatalogClient | null : client;
  const supabase = () => requireClient(configuredClient);

  return {
    listStudios: async () => {
      const result = await supabase().from<StudioRow>('studios').select('id, name, address');
      throwIfError(result.error);
      return (result.data ?? []).map(mapStudio);
    },

    listBarbers: async (studioId) => {
      let query = supabase().from<BarberRow>('barbers').select('id, studio_id, specialty, active, users!inner(display_name)').eq('active', true);
      if (studioId) query = query.eq('studio_id', studioId);
      const result = await query;
      throwIfError(result.error);
      return (result.data ?? []).filter((row) => row.active).map(mapBarber);
    },

    listServices: async (barberId) => {
      const barberResult = await supabase().from<BarberStudioRow>('barbers').select('studio_id').eq('id', barberId).eq('active', true).limit(1);
      throwIfError(barberResult.error);
      const studioId = barberResult.data?.[0]?.studio_id;
      if (!studioId) return [];

      const result = await supabase().from<ServiceRow>('services').select('id, name, duration_minutes, price_cents, active').eq('studio_id', studioId).eq('active', true);
      throwIfError(result.error);
      return (result.data ?? []).filter((row) => row.active).map(mapService);
    },

    listAvailability: async (barberId, from, to) => {
      const result = await supabase().from<AvailabilityRow>('availability_slots').select('id, barber_id, starts_at, available').eq('barber_id', barberId).eq('available', true).gte('starts_at', from).lt('starts_at', to);
      throwIfError(result.error);
      return (result.data ?? []).filter((row) => row.available).map(mapAvailability);
    },
  };
}