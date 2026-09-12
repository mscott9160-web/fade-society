-- Customer-owned booking changes. The 24-hour cancellation cutoff is policy-owned here.
create or replace function public.cancel_my_booking(p_booking_id uuid)
returns setof public.bookings
language plpgsql security definer set search_path = public, extensions, pg_temp
as $$
declare current_user_id uuid := auth.uid(); target_booking public.bookings%rowtype; previous_status public.booking_status;
begin
  if current_user_id is null then raise exception using errcode = '42501', message = 'Authentication required'; end if;
  select * into target_booking from public.bookings where id = p_booking_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Booking not found'; end if;
  if target_booking.customer_id <> current_user_id then raise exception using errcode = '42501', message = 'You are not authorized to change this booking'; end if;
  if target_booking.status = 'cancelled' then return next target_booking; return; end if;
  if target_booking.status not in ('pending', 'confirmed') then raise exception using errcode = '22023', message = 'Only pending or confirmed bookings can be cancelled'; end if;
  if target_booking.starts_at <= now() then raise exception using errcode = '22023', message = 'Past bookings cannot be cancelled'; end if;
  if target_booking.starts_at <= now() + interval '24 hours' then raise exception using errcode = '22023', message = 'Bookings can only be cancelled more than 24 hours before the appointment'; end if;
  previous_status := target_booking.status;
  update public.bookings set status = 'cancelled', updated_at = now() where id = target_booking.id returning * into target_booking;
  update public.availability_slots set available = true where id = target_booking.availability_slot_id;
  insert into public.audit_events (actor_id, event_type, entity_type, entity_id, metadata) values (current_user_id, 'booking_cancelled', 'booking', target_booking.id, jsonb_build_object('previous_status', previous_status));
  return next target_booking;
end;
$$;

create or replace function public.reschedule_my_booking(p_booking_id uuid, p_starts_at timestamptz)
returns setof public.bookings
language plpgsql security definer set search_path = public, extensions, pg_temp
as $$
declare current_user_id uuid := auth.uid(); target_booking public.bookings%rowtype; target_slot public.availability_slots%rowtype; service_duration integer; previous_starts_at timestamptz;
begin
  if current_user_id is null then raise exception using errcode = '42501', message = 'Authentication required'; end if;
  if p_starts_at is null or p_starts_at <= now() then raise exception using errcode = '22023', message = 'Rescheduled appointments must be in the future'; end if;
  select * into target_booking from public.bookings where id = p_booking_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Booking not found'; end if;
  if target_booking.customer_id <> current_user_id then raise exception using errcode = '42501', message = 'You are not authorized to change this booking'; end if;
  if target_booking.status not in ('pending', 'confirmed') then raise exception using errcode = '22023', message = 'Only pending or confirmed bookings can be rescheduled'; end if;
  if target_booking.starts_at <= now() then raise exception using errcode = '22023', message = 'Past bookings cannot be rescheduled'; end if;
  if target_booking.starts_at <= now() + interval '24 hours' then raise exception using errcode = '22023', message = 'Bookings can only be rescheduled more than 24 hours before the appointment'; end if;
  if p_starts_at = target_booking.starts_at then return next target_booking; return; end if;
  select duration_minutes into service_duration from public.services where id = target_booking.service_id and active;
  select * into target_slot from public.availability_slots where barber_id = target_booking.barber_id and starts_at = p_starts_at and available for update;
  if not found then raise exception using errcode = 'P0002', message = 'Requested slot is unavailable'; end if;
  if target_slot.starts_at + make_interval(mins => service_duration) > target_slot.ends_at then raise exception using errcode = '22023', message = 'Service duration does not fit the requested slot'; end if;
  previous_starts_at := target_booking.starts_at;
  update public.availability_slots set available = true where id = target_booking.availability_slot_id;
  update public.bookings set availability_slot_id = target_slot.id, starts_at = target_slot.starts_at, ends_at = target_slot.starts_at + make_interval(mins => service_duration), updated_at = now() where id = target_booking.id returning * into target_booking;
  update public.availability_slots set available = false where id = target_slot.id;
  insert into public.audit_events (actor_id, event_type, entity_type, entity_id, metadata) values (current_user_id, 'booking_rescheduled', 'booking', target_booking.id, jsonb_build_object('previous_starts_at', previous_starts_at, 'starts_at', target_booking.starts_at));
  return next target_booking;
end;
$$;

revoke all on function public.cancel_my_booking(uuid) from public;
revoke all on function public.reschedule_my_booking(uuid, timestamptz) from public;
grant execute on function public.cancel_my_booking(uuid) to authenticated;
grant execute on function public.reschedule_my_booking(uuid, timestamptz) to authenticated;