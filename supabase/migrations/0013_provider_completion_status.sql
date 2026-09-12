-- Add provider completion and no-show transitions to the already-deployed status RPC.
create or replace function public.update_booking_status(
  p_booking_id uuid,
  p_status public.booking_status
)
returns setof public.bookings
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  target_booking public.bookings%rowtype;
  current_role public.user_role;
  previous_status public.booking_status;
begin
  if current_user_id is null then raise exception using errcode = '42501', message = 'Authentication required'; end if;
  select role into current_role from public.users where id = current_user_id;
  if current_role is null then raise exception using errcode = '42501', message = 'Authenticated user profile is required'; end if;
  select * into target_booking from public.bookings where id = p_booking_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Booking not found'; end if;

  if p_status in ('confirmed', 'declined') then
    if target_booking.status <> 'pending' then raise exception using errcode = '22023', message = 'Only pending bookings can be reviewed'; end if;
  elsif p_status in ('completed', 'no_show') then
    if target_booking.status <> 'confirmed' then raise exception using errcode = '22023', message = 'Only confirmed bookings can be completed or marked no-show'; end if;
  else
    raise exception using errcode = '22023', message = 'Unsupported provider status transition';
  end if;
  previous_status := target_booking.status;

  if not exists (
    select 1 from public.studio_memberships membership
    where membership.studio_id = target_booking.studio_id
      and membership.user_id = current_user_id
      and membership.membership_role in ('barber', 'owner', 'admin')
  ) and current_role <> 'admin' then
    raise exception using errcode = '42501', message = 'You are not authorized to update this booking';
  end if;

  update public.bookings set status = p_status, updated_at = now() where id = p_booking_id returning * into target_booking;
  insert into public.audit_events (actor_id, event_type, entity_type, entity_id, metadata)
  values (current_user_id, 'booking_status_updated', 'booking', target_booking.id, jsonb_build_object('previous_status', previous_status, 'status', p_status));
  return next target_booking;
end;
$$;

revoke all on function public.update_booking_status(uuid, public.booking_status) from public;
grant execute on function public.update_booking_status(uuid, public.booking_status) to authenticated;
