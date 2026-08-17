import { describe, expect, it } from 'vitest';
import { createBooking, validateCreateBookingRequest } from '../supabase/functions/create-booking';

describe('Supabase Phase 3 scaffold', () => {
  it('keeps booking creation server-authoritative and idempotent', () => {
    const missingAuth = validateCreateBookingRequest({ headers: new Headers(), json: async () => ({}) });
    expect(missingAuth).toEqual({ status: 401, body: { error: 'Authentication required' } });

    const missingKey = validateCreateBookingRequest({
      headers: new Headers({ authorization: 'Bearer test-token' }),
      json: async () => ({}),
    });
    expect(missingKey).toEqual({ status: 400, body: { error: 'Idempotency-Key header required' } });
  });

  it('validates the request before invoking the RPC', async () => {
    let invoked = false;
    const response = await createBooking(
      {
        headers: new Headers({ authorization: 'Bearer test-token', 'idempotency-key': 'booking-1' }),
        json: async () => ({ serviceId: 'service-1' }),
      },
      async () => {
        invoked = true;
        return { data: null, error: null };
      },
    );

    expect(response).toEqual({ status: 400, body: { error: 'serviceId, barberId, and a valid startsAt are required' } });
    expect(invoked).toBe(false);
  });

  it('calls create_booking with server-authoritative RPC arguments and returns pending status', async () => {
    let calledWith: unknown;
    const response = await createBooking(
      {
        headers: new Headers({ authorization: 'Bearer test-token', 'idempotency-key': 'booking-1' }),
        json: async () => ({ serviceId: 'service-1', barberId: 'barber-1', startsAt: '2026-08-20T10:00:00Z' }),
      },
      async (name, args) => {
        calledWith = { name, args };
        return { data: { id: 'booking-1', status: 'pending' }, error: null };
      },
    );

    expect(calledWith).toEqual({
      name: 'create_booking',
      args: {
        p_service_id: 'service-1',
        p_barber_id: 'barber-1',
        p_starts_at: '2026-08-20T10:00:00Z',
        p_idempotency_key: 'booking-1',
      },
    });
    expect(response).toEqual({ status: 200, body: { bookingId: 'booking-1', status: 'pending' } });
  });

  it('returns the offline-safe no-config response without a network client', async () => {
    const response = await createBooking({
      headers: new Headers({ authorization: 'Bearer test-token', 'idempotency-key': 'booking-1' }),
      json: async () => ({ serviceId: 'service-1', barberId: 'barber-1', startsAt: '2026-08-20T10:00:00Z' }),
    });

    expect(response).toEqual({ status: 501, body: { error: 'Transactional create_booking RPC is not configured' } });
  });

});