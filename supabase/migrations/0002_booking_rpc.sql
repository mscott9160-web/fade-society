-- Phase 3 booking contract. All booking writes remain behind this function.
create or replace function public.create_booking(
  p_service_id uuid,
  p_barber_id uuid,
  p_starts_at timestamptz,
  p_idempotency_key text
)
returns setof public.bookings
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  selected_slot public.availability_slots%rowtype;
  selected_service public.services%rowtype;
  selected_barber public.barbers%rowtype;
  existing_key public.booking_idempotency_keys%rowtype;
  request_hash text;
  created_booking public.bookings%rowtype;
begin
  if current_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  if p_idempotency_key is null or length(trim(p_idempotency_key)) = 0 or length(p_idempotency_key) > 200 then
    raise exception using errcode = '22023', message = 'A valid idempotency key is required';
  end if;

  if not exists (select 1 from public.users where id = current_user_id) then
    raise exception using errcode = '42501', message = 'Authenticated user profile is required';
  end if;

  request_hash := encode(
    digest(
      jsonb_build_object(
        'service_id', p_service_id,
        'barber_id', p_barber_id,
        'starts_at', p_starts_at
      )::text,
      'sha256'
    ),
    'hex'
  );

  insert into public.booking_idempotency_keys (actor_id, idempotency_key, request_hash)
  values (current_user_id, trim(p_idempotency_key), request_hash)
  on conflict (actor_id, idempotency_key) do nothing;

  select *
    into existing_key
    from public.booking_idempotency_keys
   where actor_id = current_user_id
     and idempotency_key = trim(p_idempotency_key)
   for update;

  if existing_key.request_hash <> request_hash then
    raise exception using errcode = '22023', message = 'Idempotency key was reused for a different booking request';
  end if;

  if existing_key.booking_id is not null then
    return query select * from public.bookings where id = existing_key.booking_id;
    return;
  end if;

  select *
    into selected_barber
    from public.barbers
   where id = p_barber_id
     and active;
  if not found then
    raise exception using errcode = 'P0002', message = 'Barber is unavailable';
  end if;

  select *
    into selected_service
    from public.services
   where id = p_service_id
     and studio_id = selected_barber.studio_id
     and active;
  if not found then
    raise exception using errcode = 'P0002', message = 'Service is not available for this barber';
  end if;

  select *
    into selected_slot
    from public.availability_slots
   where barber_id = p_barber_id
     and starts_at = p_starts_at
     and available
   for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Requested slot is unavailable';
  end if;

  if selected_slot.starts_at + make_interval(mins => selected_service.duration_minutes) > selected_slot.ends_at then
    raise exception using errcode = '22023', message = 'Service duration does not fit the requested slot';
  end if;

  insert into public.bookings (
    customer_id,
    barber_id,
    studio_id,
    service_id,
    availability_slot_id,
    starts_at,
    ends_at,
    price_cents,
    status
  ) values (
    current_user_id,
    selected_barber.id,
    selected_barber.studio_id,
    selected_service.id,
    selected_slot.id,
    selected_slot.starts_at,
    selected_slot.starts_at + make_interval(mins => selected_service.duration_minutes),
    selected_service.price_cents,
    'pending'
  )
  returning * into created_booking;

  update public.availability_slots
     set available = false
   where id = selected_slot.id;

  update public.booking_idempotency_keys
     set booking_id = created_booking.id
   where actor_id = current_user_id
     and idempotency_key = trim(p_idempotency_key);

  return next created_booking;
end;
$$;

revoke all on function public.create_booking(uuid, uuid, timestamptz, text) from public;
grant execute on function public.create_booking(uuid, uuid, timestamptz, text) to authenticated;
