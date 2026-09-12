-- Allow active studio members to operate bookings for their studio.
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
begin
  if current_user_id is null then raise exception using errcode = '42501', message = 'Authentication required'; end if;
  select role into current_role from public.users where id = current_user_id;
  if current_role is null then raise exception using errcode = '42501', message = 'Authenticated user profile is required'; end if;
  if p_status not in ('confirmed', 'declined') then raise exception using errcode = '22023', message = 'Only confirmed or declined status is supported'; end if;

  select * into target_booking from public.bookings where id = p_booking_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Booking not found'; end if;
  if target_booking.status <> 'pending' then raise exception using errcode = '22023', message = 'Only pending bookings can be reviewed'; end if;

  if not exists (
    select 1 from public.studio_memberships membership
    where membership.studio_id = target_booking.studio_id
      and membership.user_id = current_user_id
      and membership.membership_role in ('barber', 'owner', 'admin')
  ) and current_role <> 'admin' then
    raise exception using errcode = '42501', message = 'You are not authorized to review this booking';
  end if;

  update public.bookings set status = p_status, updated_at = now() where id = p_booking_id returning * into target_booking;
  insert into public.audit_events (actor_id, event_type, entity_type, entity_id, metadata)
  values (current_user_id, 'booking_status_updated', 'booking', target_booking.id, jsonb_build_object('status', p_status));
  return next target_booking;
end;
$$;

revoke all on function public.update_booking_status(uuid, public.booking_status) from public;
grant execute on function public.update_booking_status(uuid, public.booking_status) to authenticated;

-- Return one thread per booking even before the first message is sent.
create or replace function public.list_my_messages()
returns table (id uuid, conversation_id uuid, booking_id uuid, sender_id uuid, participant_id uuid, participant_name text, body text, created_at timestamptz, unread boolean)
language sql stable security definer
set search_path = public, extensions, pg_temp
as $$
  select distinct on (c.id)
    coalesce(m.id, c.id), c.id, c.booking_id, coalesce(m.sender_id, auth.uid()), other.user_id, u.display_name,
    coalesce(m.body, 'Start a conversation about this booking.'), coalesce(m.created_at, c.created_at),
    (m.id is not null and coalesce(rs.last_read_at, '-infinity'::timestamptz) < m.created_at and m.sender_id <> auth.uid())
  from public.conversations c
  join public.conversation_members mine on mine.conversation_id = c.id and mine.user_id = auth.uid()
  join public.conversation_members other on other.conversation_id = c.id and other.user_id <> auth.uid()
  join public.users u on u.id = other.user_id
  left join public.messages m on m.id = (select latest.id from public.messages latest where latest.conversation_id = c.id order by latest.created_at desc limit 1)
  left join public.conversation_read_state rs on rs.conversation_id = c.id and rs.user_id = auth.uid()
  where public.messaging_actor_can_access(c.id)
  order by c.id, m.created_at desc nulls last;
$$;

revoke all on function public.list_my_messages() from public;
grant execute on function public.list_my_messages() to authenticated;
