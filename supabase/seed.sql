-- Fade Society catalog seed
-- Safe to rerun. This file never creates auth.users or contains credentials.
-- Run the migrations first, then execute this file in Supabase SQL Editor.

begin;

-- Public catalog data is independent of authentication and can be seeded first.
insert into public.studios (id, name, address, timezone)
values
  ('10000000-0000-4000-8000-000000000001', 'Fade Society Downtown', '125 Main Street, Austin, TX', 'America/Chicago'),
  ('10000000-0000-4000-8000-000000000002', 'Fade Society Eastside', '820 East 6th Street, Austin, TX', 'America/Chicago')
on conflict (id) do update set
  name = excluded.name,
  address = excluded.address,
  timezone = excluded.timezone;

insert into public.services (id, studio_id, name, duration_minutes, price_cents, active)
values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Signature Fade', 45, 4500, true),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'Beard Trim', 30, 2500, true),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', 'Classic Cut', 45, 4000, true),
  ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000002', 'Cut and Beard', 60, 6000, true)
on conflict (id) do update set
  studio_id = excluded.studio_id,
  name = excluded.name,
  duration_minutes = excluded.duration_minutes,
  price_cents = excluded.price_cents,
  active = excluded.active;

-- Provider prerequisites and availability intentionally depend on Auth users.
-- Create the matching user in Authentication first, then rerun this file.
-- This block only looks up an existing auth.users row; it never creates one.
do $$
declare
  provider_id uuid;
  downtown_studio_id uuid := '10000000-0000-4000-8000-000000000001';
begin
  select id
    into provider_id
    from auth.users
   where email = 'barber.demo@example.com'
   limit 1;

  if provider_id is null then
    raise notice 'Skipped demo provider and availability: create barber.demo@example.com in Authentication, then rerun supabase/seed.sql.';
    return;
  end if;

  insert into public.users (id, display_name, role)
  values (provider_id, 'Jordan Fade', 'barber')
  on conflict (id) do update set
    display_name = excluded.display_name,
    role = excluded.role;

  insert into public.studio_memberships (studio_id, user_id, membership_role)
  values (downtown_studio_id, provider_id, 'barber')
  on conflict (studio_id, user_id) do update set
    membership_role = excluded.membership_role;

  insert into public.barbers (id, studio_id, specialty, active)
  values (provider_id, downtown_studio_id, 'Fades and textured cuts', true)
  on conflict (id) do update set
    studio_id = excluded.studio_id,
    specialty = excluded.specialty,
    active = excluded.active;

  insert into public.availability_slots (id, barber_id, starts_at, ends_at, available)
  values
    ('30000000-0000-4000-8000-000000000001', provider_id, '2026-09-01 15:00:00+00', '2026-09-01 15:45:00+00', true),
    ('30000000-0000-4000-8000-000000000002', provider_id, '2026-09-01 16:00:00+00', '2026-09-01 16:45:00+00', true),
    ('30000000-0000-4000-8000-000000000003', provider_id, '2026-09-03 15:00:00+00', '2026-09-03 15:45:00+00', true),
    ('30000000-0000-4000-8000-000000000004', provider_id, '2026-09-03 16:00:00+00', '2026-09-03 16:45:00+00', true)
  on conflict (id) do update set
    barber_id = excluded.barber_id,
    starts_at = excluded.starts_at,
    ends_at = excluded.ends_at;
end;
$$;

commit;
