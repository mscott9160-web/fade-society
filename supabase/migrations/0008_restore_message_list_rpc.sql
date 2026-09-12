-- Restore messaging read RPCs after the restored project retained migration metadata
-- without the function definitions.
create table if not exists public.conversation_read_state (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
alter table public.conversation_read_state enable row level security;

create table if not exists public.message_idempotency_keys (
  actor_id uuid not null references public.users(id) on delete cascade,
  idempotency_key text not null,
  request_hash text not null,
  message_id uuid references public.messages(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (actor_id, idempotency_key)
);
alter table public.message_idempotency_keys enable row level security;

create or replace function public.messaging_actor_can_access(p_conversation_id uuid)
returns boolean
language sql stable security definer
set search_path = public, extensions, pg_temp
as $$
  select exists (select 1 from public.conversation_members where conversation_id = p_conversation_id and user_id = auth.uid())
    and exists (
      select 1
      from public.conversations c
      left join public.bookings b on b.id = c.booking_id
      where c.id = p_conversation_id
        and (c.booking_id is null or b.customer_id = auth.uid() or b.barber_id = auth.uid() or exists (select 1 from public.studio_memberships sm where sm.studio_id = b.studio_id and sm.user_id = auth.uid()))
    );
$$;

create or replace function public.list_my_messages()
returns table (id uuid, conversation_id uuid, booking_id uuid, sender_id uuid, participant_id uuid, participant_name text, body text, created_at timestamptz, unread boolean)
language sql stable security definer
set search_path = public, extensions, pg_temp
as $$
  select distinct on (m.conversation_id)
    m.id, c.id, c.booking_id, m.sender_id, other.user_id, u.display_name, m.body, m.created_at,
    (coalesce(rs.last_read_at, '-infinity'::timestamptz) < m.created_at and m.sender_id <> auth.uid())
  from public.messages m
  join public.conversations c on c.id = m.conversation_id
  join public.conversation_members mine on mine.conversation_id = c.id and mine.user_id = auth.uid()
  join public.conversation_members other on other.conversation_id = c.id and other.user_id <> auth.uid()
  join public.users u on u.id = other.user_id
  left join public.conversation_read_state rs on rs.conversation_id = c.id and rs.user_id = auth.uid()
  where public.messaging_actor_can_access(c.id)
  order by m.conversation_id, m.created_at desc;
$$;

revoke all on function public.messaging_actor_can_access(uuid) from public;
revoke all on function public.list_my_messages() from public;
grant execute on function public.list_my_messages() to authenticated;
