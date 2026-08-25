import type { Booking, BookingStatus } from '@/domain/models';
import type { BookingRepository, CreateBookingInput } from './repositories';
import { getSupabaseClient } from './supabase-client';

const UNSUPPORTED_RESCHEDULE = 'Booking rescheduling is not supported by the backend';
const UNSUPPORTED_CANCEL = 'Booking cancellation is not supported by the backend';
const UNAVAILABLE = 'Unavailable';
const BOOKING_SELECT = 'id, service_id, barber_id, studio_id, starts_at, price_cents, status, services(name), barbers(users(display_name)), studios(name)';

type BookingRow = {
  id: string;
  service_id: string;
  barber_id: string;
  studio_id: string;
  starts_at: string;
  price_cents: number;
  status: string;
  services: { name: string } | { name: string }[] | null;
  barbers: { users: { display_name: string } | { display_name: string }[] | null } | { users: { display_name: string } | { display_name: string }[] | null }[] | null;
  studios: { name: string } | { name: string }[] | null;
};

type QueryResult<Row> = { data: Row[] | null; error: Error | null };
type BookingQuery<Row> = PromiseLike<QueryResult<Row>> & {
  select: (columns: string) => BookingQuery<Row>;
  eq: (column: string, value: string) => BookingQuery<Row>;
  limit: (count: number) => BookingQuery<Row>;
};

export type BookingClient = {
  from: <Row>(table: string) => BookingQuery<Row>;
  rpc: <Row>(name: string, args: Record<string, unknown>) => PromiseLike<QueryResult<Row>>;
};

function requireClient(client: BookingClient | null): BookingClient {
  if (!client) throw new Error('Supabase is not configured');
  return client;
}

function throwIfError(error: Error | null): void {
  if (error) throw error;
}

function first<Row>(value: Row | Row[] | null): Row | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function mapBooking(row: BookingRow): Booking {
  const service = first(row.services);
  const barber = first(row.barbers);
  const studio = first(row.studios);
  const user = first(barber?.users ?? null);

  if (!['pending', 'confirmed', 'declined', 'failed', 'cancelled', 'completed', 'no_show'].includes(row.status)) {
    throw new Error(`Invalid booking status: ${row.status}`);
  }

  return {
    id: row.id,
    serviceId: row.service_id,
    serviceName: service?.name ?? UNAVAILABLE,
    barberId: row.barber_id,
    barberName: user?.display_name ?? UNAVAILABLE,
    studioId: row.studio_id,
    studioName: studio?.name ?? UNAVAILABLE,
    startsAt: row.starts_at,
    confirmationCode: UNAVAILABLE,
    status: row.status as BookingStatus,
    price: row.price_cents / 100,
    cancellationPolicy: UNAVAILABLE,
  };
}

function requireSingle<Row>(rows: Row[] | null, message: string): Row {
  if (!rows || rows.length === 0) throw new Error(message);
  if (rows.length > 1) throw new Error('Supabase returned multiple booking rows');
  return rows[0];
}

export function createSupabaseBookingRepository(client?: BookingClient | null): BookingRepository {
  const configuredClient = client === undefined ? getSupabaseClient() as unknown as BookingClient | null : client;
  const supabase = () => requireClient(configuredClient);

  const hydrate = async (bookingId: string): Promise<Booking> => {
    const result = await supabase().from<BookingRow>('bookings').select(BOOKING_SELECT).eq('id', bookingId).limit(1);
    throwIfError(result.error);
    return mapBooking(requireSingle(result.data, 'Created booking could not be read'));
  };

  return {
    listMine: async (_userId) => {
      const result = await supabase().from<BookingRow>('bookings').select(BOOKING_SELECT);
      throwIfError(result.error);
      return (result.data ?? []).map(mapBooking);
    },

    create: async (_userId, input: CreateBookingInput, idempotencyKey) => {
      const result = await supabase().rpc<BookingRow>('create_booking', {
        p_service_id: input.serviceId,
        p_barber_id: input.barberId,
        p_starts_at: input.startsAt,
        p_idempotency_key: idempotencyKey,
      });
      throwIfError(result.error);
      const row = requireSingle(result.data, 'Create booking RPC returned no booking');
      return hydrate(row.id);
    },

    reschedule: async () => { throw new Error(UNSUPPORTED_RESCHEDULE); },
    cancel: async () => { throw new Error(UNSUPPORTED_CANCEL); },
  };
}
