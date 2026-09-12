-- Store confirmation references as server-owned booking data.
alter table public.bookings
  add column if not exists confirmation_code text;

update public.bookings
   set confirmation_code = 'FS-' || upper(substr(replace(id::text, '-', ''), 1, 8))
 where confirmation_code is null;

alter table public.bookings
  alter column confirmation_code set default ('FS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  alter column confirmation_code set not null;

create unique index if not exists bookings_confirmation_code_unique
  on public.bookings (confirmation_code);

drop function if exists public.list_provider_bookings();
drop function if exists public.get_provider_booking(uuid);

create or replace function public.list_provider_bookings()
returns table (
  id uuid, customer_id uuid, service_id uuid, barber_id uuid, studio_id uuid,
  starts_at timestamptz, price_cents integer, status public.booking_status,
  confirmation_code text, service_name text, customer_name text, barber_name text, studio_name text
)
language sql stable security definer set search_path = public, extensions, pg_temp
as $$
  select booking.id, booking.customer_id, booking.service_id, booking.barber_id, booking.studio_id,
    booking.starts_at, booking.price_cents, booking.status, booking.confirmation_code,
    service.name, customer.display_name, barber_user.display_name, studio.name
  from public.bookings booking
  join public.users actor on actor.id = auth.uid()
  join public.services service on service.id = booking.service_id
  join public.users customer on customer.id = booking.customer_id
  join public.barbers barber on barber.id = booking.barber_id
  join public.users barber_user on barber_user.id = barber.id
  join public.studios studio on studio.id = booking.studio_id
  where (
    (actor.role = 'barber' and booking.barber_id = auth.uid())
    or (actor.role in ('owner', 'admin') and exists (
      select 1 from public.studio_memberships membership
      where membership.studio_id = booking.studio_id
        and membership.user_id = auth.uid()
        and membership.active
        and membership.membership_role in ('owner', 'admin')
    ))
  )
  order by booking.starts_at;
$$;

create or replace function public.get_provider_booking(p_booking_id uuid)
returns table (
  id uuid, customer_id uuid, service_id uuid, barber_id uuid, studio_id uuid,
  starts_at timestamptz, price_cents integer, status public.booking_status,
  confirmation_code text, service_name text, customer_name text, barber_name text, studio_name text
)
language sql stable security definer set search_path = public, extensions, pg_temp
as $$
  select booking.id, booking.customer_id, booking.service_id, booking.barber_id, booking.studio_id,
    booking.starts_at, booking.price_cents, booking.status, booking.confirmation_code,
    service.name, customer.display_name, barber_user.display_name, studio.name
  from public.bookings booking
  join public.services service on service.id = booking.service_id
  join public.users customer on customer.id = booking.customer_id
  join public.barbers barber on barber.id = booking.barber_id
  join public.users barber_user on barber_user.id = barber.id
  join public.studios studio on studio.id = booking.studio_id
  where booking.id = p_booking_id
    and public.provider_booking_can_read(p_booking_id, auth.uid());
$$;

grant execute on function public.list_provider_bookings() to authenticated;
grant execute on function public.get_provider_booking(uuid) to authenticated;
