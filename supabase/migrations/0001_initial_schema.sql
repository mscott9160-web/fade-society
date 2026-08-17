-- Phase 3 foundation. All booking writes must go through a trusted RPC or Edge Function.
create extension if not exists pgcrypto;

create type public.user_role as enum ('customer', 'barber', 'owner', 'admin');
create type public.booking_status as enum ('pending', 'confirmed', 'declined', 'failed', 'cancelled', 'completed', 'no_show');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.studios (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now()
);

create table public.studio_memberships (
  studio_id uuid not null references public.studios(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  membership_role public.user_role not null check (membership_role in ('barber', 'owner', 'admin')),
  created_at timestamptz not null default now(),
  primary key (studio_id, user_id)
);

create table public.barbers (
  id uuid primary key references public.users(id) on delete cascade,
  studio_id uuid not null references public.studios(id) on delete restrict,
  specialty text,
  active boolean not null default true
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  name text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  price_cents integer not null check (price_cents >= 0),
  active boolean not null default true
);

create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references public.barbers(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  starts_at time not null,
  ends_at time not null,
  provider_timezone text not null default 'UTC',
  active boolean not null default true,
  check (starts_at < ends_at)
);

create table public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid not null references public.barbers(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  available boolean not null default true,
  unique (barber_id, starts_at),
  check (starts_at < ends_at)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.users(id) on delete restrict,
  barber_id uuid not null references public.barbers(id) on delete restrict,
  studio_id uuid not null references public.studios(id) on delete restrict,
  service_id uuid not null references public.services(id) on delete restrict,
  availability_slot_id uuid not null references public.availability_slots(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  price_cents integer not null check (price_cents >= 0),
  status public.booking_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_at < ends_at)
);

create unique index bookings_one_active_per_slot
  on public.bookings (availability_slot_id)
  where status in ('pending', 'confirmed');

create table public.booking_idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.users(id) on delete cascade,
  idempotency_key text not null,
  request_hash text not null,
  booking_id uuid references public.bookings(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (actor_id, idempotency_key)
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  primary key (conversation_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete restrict,
  body text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users(id) on delete set null,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index availability_slots_lookup on public.availability_slots (barber_id, starts_at);
create index bookings_customer_lookup on public.bookings (customer_id, starts_at desc);
create index messages_conversation_lookup on public.messages (conversation_id, created_at);

-- RLS is deny-by-default. Mutations stay behind server-side RPCs/Edge Functions.
alter table public.users enable row level security;
alter table public.studios enable row level security;
alter table public.studio_memberships enable row level security;
alter table public.barbers enable row level security;
alter table public.services enable row level security;
alter table public.availability_rules enable row level security;
alter table public.availability_slots enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_idempotency_keys enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.audit_events enable row level security;

create policy users_read_self on public.users for select using (id = auth.uid());
create policy studios_read_authenticated on public.studios for select to authenticated using (true);
create policy barbers_read_authenticated on public.barbers for select to authenticated using (active);
create policy services_read_authenticated on public.services for select to authenticated using (active);
create policy slots_read_authenticated on public.availability_slots for select to authenticated using (available);
create policy bookings_read_customer on public.bookings for select using (customer_id = auth.uid());
create policy bookings_read_barber on public.bookings for select using (barber_id = auth.uid());
create policy conversation_members_read_self on public.conversation_members for select using (user_id = auth.uid());
create policy messages_read_member on public.messages for select using (
  exists (select 1 from public.conversation_members m where m.conversation_id = conversation_id and m.user_id = auth.uid())
);

-- No client insert/update/delete policies are intentional. The service role/RPC layer
-- must verify role, studio membership, slot ownership, price, and status transitions.