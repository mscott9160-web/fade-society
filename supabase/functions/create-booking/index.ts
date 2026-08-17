export type CreateBookingRequest = {
  serviceId: string;
  barberId: string;
  startsAt: string;
};

export type CreateBookingResponse = {
  bookingId: string;
  status: 'pending' | 'confirmed';
};

export type CreateBookingRpcArgs = {
  p_service_id: string;
  p_barber_id: string;
  p_starts_at: string;
  p_idempotency_key: string;
};

export type CreateBookingRpc = (
  functionName: 'create_booking',
  args: CreateBookingRpcArgs,
) => Promise<{ data: { id: string; status: 'pending' | 'confirmed' } | null; error: { message: string } | null }>;

export type EdgeFunctionRequest = {
  headers: Headers;
  json: () => Promise<unknown>;
};

export type EdgeFunctionResponse = {
  status: number;
  body: { error: string } | CreateBookingResponse;
};

export function validateCreateBookingRequest(
  request: EdgeFunctionRequest,
): { authorization: string; idempotencyKey: string; input: CreateBookingRequest } | EdgeFunctionResponse {
  const authorization = request.headers.get('authorization');
  const idempotencyKey = request.headers.get('idempotency-key');
  if (!authorization?.startsWith('Bearer ')) return { status: 401, body: { error: 'Authentication required' } };
  if (!idempotencyKey) return { status: 400, body: { error: 'Idempotency-Key header required' } };
  return { authorization, idempotencyKey, input: {} as CreateBookingRequest };
}

export async function createBooking(
  request: EdgeFunctionRequest,
  rpc?: CreateBookingRpc,
): Promise<EdgeFunctionResponse> {
  const validation = validateCreateBookingRequest(request);
  if ('status' in validation) return validation;

  let body: Partial<CreateBookingRequest>;
  try {
    body = (await request.json()) as Partial<CreateBookingRequest>;
  } catch {
    return { status: 400, body: { error: 'Invalid JSON body' } };
  }

  if (
    typeof body.serviceId !== 'string' ||
    typeof body.barberId !== 'string' ||
    typeof body.startsAt !== 'string' ||
    Number.isNaN(Date.parse(body.startsAt))
  ) {
    return { status: 400, body: { error: 'serviceId, barberId, and a valid startsAt are required' } };
  }

  if (!rpc) return { status: 501, body: { error: 'Transactional create_booking RPC is not configured' } };

  const result = await rpc('create_booking', {
    p_service_id: body.serviceId,
    p_barber_id: body.barberId,
    p_starts_at: body.startsAt,
    p_idempotency_key: validation.idempotencyKey,
  });

  if (result.error || !result.data) {
    return { status: 409, body: { error: result.error?.message ?? 'Booking could not be created' } };
  }

  return { status: 200, body: { bookingId: result.data.id, status: result.data.status } };
}
