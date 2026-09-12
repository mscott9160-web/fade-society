-- Provider availability editor. All slot writes remain behind server-authoritative RPCs.
create or replace function public.list_provider_availability(
  p_barber_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
returns setof public.availability_slots
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  current_role public.user_role;
  target_studio_id uuid;
begin
  if current_user_id is null then raise exception using errcode = '42501', message = 'Authentication required'; end if;
  select role into current_role from public.users where id = current_user_id;
  if current_role is null then raise exception using errcode = '42501', message = 'Authenticated user profile is required'; end if;
  if p_from is null or p_to is null or p_from >= p_to then raise exception using errcode = '22023', message = 'Invalid availability range'; end if;
  select studio_id into target_studio_id from public.barbers where id = p_barber_id and active;
  if not found then raise exception using errcode = 'P0002', message = 'Barber is unavailable'; end if;
  if current_role <> 'admin' and not exists (select 1 from public.studio_memberships where studio_id = target_studio_id and user_id = current_user_id and membership_role in ('barber', 'owner', 'admin')) then
    raise exception using errcode = '42501', message = 'You are not authorized to view this schedule';
  end if;
  return query select * from public.availability_slots where barber_id = p_barber_id and starts_at >= p_from and starts_at < p_to order by starts_at;
end;
$$;

create or replace function public.add_provider_availability(p_barber_id uuid, p_starts_at timestamptz, p_ends_at timestamptz)
returns setof public.availability_slots
language plpgsql security definer set search_path = public, pg_temp
as $$
declare current_user_id uuid := auth.uid(); current_role public.user_role; target_studio_id uuid; created_slot public.availability_slots%rowtype;
begin
  if current_user_id is null then raise exception using errcode = '42501', message = 'Authentication required'; end if;
  select role into current_role from public.users where id = current_user_id;
  if current_role is null then raise exception using errcode = '42501', message = 'Authenticated user profile is required'; end if;
  if p_starts_at is null or p_ends_at is null or p_starts_at >= p_ends_at then raise exception using errcode = '22023', message = 'Invalid availability interval'; end if;
  if p_starts_at <= now() then raise exception using errcode = '22023', message = 'Availability must be in the future'; end if;
  select studio_id into target_studio_id from public.barbers where id = p_barber_id and active;
  if not found then raise exception using errcode = 'P0002', message = 'Barber is unavailable'; end if;
  if current_role <> 'admin' and not exists (select 1 from public.studio_memberships where studio_id = target_studio_id and user_id = current_user_id and membership_role in ('barber', 'owner', 'admin')) then
    raise exception using errcode = '42501', message = 'You are not authorized to edit this schedule';
  end if;
  insert into public.availability_slots (barber_id, starts_at, ends_at, available) values (p_barber_id, p_starts_at, p_ends_at, true) returning * into created_slot;
  return next created_slot;
exception when unique_violation then raise exception using errcode = '23505', message = 'An availability slot already exists at this time';
end;
$$;

create or replace function public.remove_provider_availability(p_slot_id uuid)
returns setof public.availability_slots
language plpgsql security definer set search_path = public, pg_temp
as $$
declare current_user_id uuid := auth.uid(); current_role public.user_role; target_slot public.availability_slots%rowtype; target_studio_id uuid;
begin
  if current_user_id is null then raise exception using errcode = '42501', message = 'Authentication required'; end if;
  select role into current_role from public.users where id = current_user_id;
  if current_role is null then raise exception using errcode = '42501', message = 'Authenticated user profile is required'; end if;
  select slot.* into target_slot from public.availability_slots slot where slot.id = p_slot_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'Availability slot not found'; end if;
  if target_slot.starts_at <= now() then raise exception using errcode = '22023', message = 'Only future availability can be removed'; end if;
  select studio_id into target_studio_id from public.barbers where id = target_slot.barber_id and active;
  if current_role <> 'admin' and not exists (select 1 from public.studio_memberships where studio_id = target_studio_id and user_id = current_user_id and membership_role in ('barber', 'owner', 'admin')) then
    raise exception using errcode = '42501', message = 'You are not authorized to edit this schedule';
  end if;
  if not target_slot.available or exists (select 1 from public.bookings where availability_slot_id = target_slot.id) then
    raise exception using errcode = '22023', message = 'Booked or unavailable slots cannot be removed';
  end if;
  delete from public.availability_slots where id = target_slot.id returning * into target_slot;
  return next target_slot;
end;
$$;

revoke all on function public.list_provider_availability(uuid, timestamptz, timestamptz) from public;
revoke all on function public.add_provider_availability(uuid, timestamptz, timestamptz) from public;
revoke all on function public.remove_provider_availability(uuid) from public;
grant execute on function public.list_provider_availability(uuid, timestamptz, timestamptz) to authenticated;
grant execute on function public.add_provider_availability(uuid, timestamptz, timestamptz) to authenticated;
grant execute on function public.remove_provider_availability(uuid) to authenticated;