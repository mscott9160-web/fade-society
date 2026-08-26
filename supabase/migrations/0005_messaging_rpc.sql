create table public.conversation_read_state (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
alter table public.conversation_read_state enable row level security;

create table public.message_idempotency_keys (
  actor_id uuid not null references public.users(id) on delete cascade,
  idempotency_key text not null,
  request_hash text not null,
  message_id uuid references public.messages(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (actor_id, idempotency_key)
);
alter table public.message_idempotency_keys enable row level security;

create or replace function public.messaging_actor_can_access(p_conversation_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.conversation_members where conversation_id = p_conversation_id and user_id = auth.uid())
    and exists (select 1 from public.conversations c left join public.bookings b on b.id = c.booking_id where c.id = p_conversation_id and (c.booking_id is null or b.customer_id = auth.uid() or b.barber_id = auth.uid() or exists (select 1 from public.studio_memberships sm where sm.studio_id = b.studio_id and sm.user_id = auth.uid())));
$$;

create or replace function public.list_my_messages()
returns table (id uuid, conversation_id uuid, booking_id uuid, sender_id uuid, participant_id uuid, participant_name text, body text, created_at timestamptz, unread boolean)
language sql stable security definer set search_path = public, pg_temp as $$
  select distinct on (m.conversation_id) m.id, m.conversation_id, c.booking_id, m.sender_id, other.user_id, u.display_name, m.body, m.created_at, (coalesce(rs.last_read_at, '-infinity'::timestamptz) < m.created_at and m.sender_id <> auth.uid())
  from public.messages m join public.conversations c on c.id = m.conversation_id join public.conversation_members mine on mine.conversation_id = c.id and mine.user_id = auth.uid() join public.conversation_members other on other.conversation_id = c.id and other.user_id <> auth.uid() join public.users u on u.id = other.user_id left join public.conversation_read_state rs on rs.conversation_id = c.id and rs.user_id = auth.uid()
  where public.messaging_actor_can_access(c.id) order by m.conversation_id, m.created_at desc;
$$;

create or replace function public.send_message(p_participant_id uuid, p_body text, p_idempotency_key text)
returns table (id uuid, conversation_id uuid, booking_id uuid, sender_id uuid, participant_id uuid, participant_name text, body text, created_at timestamptz, unread boolean)
language plpgsql security definer set search_path = public, pg_temp as $$
declare actor uuid := auth.uid(); conversation uuid; key public.message_idempotency_keys%rowtype; new_message public.messages%rowtype; hash text;
begin
  if actor is null then raise exception using errcode = '42501', message = 'Authentication required'; end if;
  if p_body is null or length(trim(p_body)) = 0 or length(p_body) > 4000 then raise exception using errcode = '22023', message = 'Message body must contain 1 to 4000 characters'; end if;
  if p_idempotency_key is null or length(trim(p_idempotency_key)) = 0 or length(p_idempotency_key) > 200 then raise exception using errcode = '22023', message = 'A valid idempotency key is required'; end if;
  select c.id into conversation from public.conversations c join public.conversation_members a on a.conversation_id = c.id and a.user_id = actor join public.conversation_members b on b.conversation_id = c.id and b.user_id = p_participant_id where public.messaging_actor_can_access(c.id) limit 1;
  if conversation is null then raise exception using errcode = '42501', message = 'Conversation access denied'; end if;
  hash := encode(digest(jsonb_build_object('participant_id', p_participant_id, 'body', p_body)::text, 'sha256'), 'hex');
  insert into public.message_idempotency_keys values (actor, trim(p_idempotency_key), hash, null) on conflict do nothing;
  select * into key from public.message_idempotency_keys where actor_id = actor and idempotency_key = trim(p_idempotency_key) for update;
  if key.request_hash <> hash then raise exception using errcode = '22023', message = 'Idempotency key was reused for a different message'; end if;
  if key.message_id is not null then new_message := (select m from public.messages m where m.id = key.message_id); else insert into public.messages(conversation_id, sender_id, body) values (conversation, actor, trim(p_body)) returning * into new_message; update public.message_idempotency_keys set message_id = new_message.id where actor_id = actor and idempotency_key = trim(p_idempotency_key); end if;
  return query select new_message.id, new_message.conversation_id, c.booking_id, new_message.sender_id, other.user_id, u.display_name, new_message.body, new_message.created_at, false from public.conversations c join public.conversation_members other on other.conversation_id = c.id and other.user_id <> actor join public.users u on u.id = other.user_id where c.id = new_message.conversation_id;
end; $$;

create or replace function public.mark_conversation_read(p_participant_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare conversation uuid;
begin
  select c.id into conversation from public.conversations c join public.conversation_members a on a.conversation_id = c.id and a.user_id = auth.uid() join public.conversation_members b on b.conversation_id = c.id and b.user_id = p_participant_id where public.messaging_actor_can_access(c.id) limit 1;
  if conversation is null then raise exception using errcode = '42501', message = 'Conversation access denied'; end if;
  insert into public.conversation_read_state values (conversation, auth.uid(), now()) on conflict (conversation_id, user_id) do update set last_read_at = excluded.last_read_at;
end; $$;

revoke all on function public.messaging_actor_can_access(uuid) from public;
revoke all on function public.list_my_messages() from public;
revoke all on function public.send_message(uuid, text, text) from public;
revoke all on function public.mark_conversation_read(uuid) from public;
grant execute on function public.list_my_messages() to authenticated;
grant execute on function public.send_message(uuid, text, text) to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;