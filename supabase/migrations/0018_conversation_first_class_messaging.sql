-- Make conversation identity explicit for message writes and read state.
drop function if exists public.send_message(uuid, text, text);
drop function if exists public.mark_conversation_read(uuid);

create or replace function public.list_my_messages()
returns table (id uuid, conversation_id uuid, booking_id uuid, sender_id uuid, participant_id uuid, participant_name text, body text, created_at timestamptz, unread boolean)
language sql stable security definer set search_path = public, extensions, pg_temp
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

create or replace function public.send_message(p_conversation_id uuid, p_body text, p_idempotency_key text)
returns table (id uuid, conversation_id uuid, booking_id uuid, sender_id uuid, participant_id uuid, participant_name text, body text, created_at timestamptz, unread boolean)
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare actor uuid := auth.uid(); key public.message_idempotency_keys%rowtype; new_message public.messages%rowtype; hash text;
begin
  if actor is null then raise exception using errcode = '42501', message = 'Authentication required'; end if;
  if p_body is null or length(trim(p_body)) = 0 or length(p_body) > 4000 then raise exception using errcode = '22023', message = 'Message body must contain 1 to 4000 characters'; end if;
  if p_idempotency_key is null or length(trim(p_idempotency_key)) = 0 or length(p_idempotency_key) > 200 then raise exception using errcode = '22023', message = 'A valid idempotency key is required'; end if;
  if not public.messaging_actor_can_access(p_conversation_id) then raise exception using errcode = '42501', message = 'Conversation access denied'; end if;
  hash := encode(digest(jsonb_build_object('conversation_id', p_conversation_id, 'body', p_body)::text, 'sha256'), 'hex');
  insert into public.message_idempotency_keys values (actor, trim(p_idempotency_key), hash, null) on conflict do nothing;
  select * into key from public.message_idempotency_keys where actor_id = actor and idempotency_key = trim(p_idempotency_key) for update;
  if key.request_hash <> hash then raise exception using errcode = '22023', message = 'Idempotency key was reused for a different message'; end if;
  if key.message_id is not null then new_message := (select m from public.messages m where m.id = key.message_id);
  else insert into public.messages(conversation_id, sender_id, body) values (p_conversation_id, actor, trim(p_body)) returning * into new_message;
    update public.message_idempotency_keys set message_id = new_message.id where actor_id = actor and idempotency_key = trim(p_idempotency_key); end if;
  return query select new_message.id, new_message.conversation_id, c.booking_id, new_message.sender_id, other.user_id, u.display_name, new_message.body, new_message.created_at, false
  from public.conversations c join public.conversation_members other on other.conversation_id = c.id and other.user_id <> actor join public.users u on u.id = other.user_id where c.id = new_message.conversation_id;
end; $$;

create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void language plpgsql security definer set search_path = public, extensions, pg_temp as $$
begin
  if not public.messaging_actor_can_access(p_conversation_id) then raise exception using errcode = '42501', message = 'Conversation access denied'; end if;
  insert into public.conversation_read_state values (p_conversation_id, auth.uid(), now()) on conflict (conversation_id, user_id) do update set last_read_at = excluded.last_read_at;
end; $$;

revoke all on function public.send_message(uuid, text, text) from public;
revoke all on function public.mark_conversation_read(uuid) from public;
grant execute on function public.send_message(uuid, text, text) to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;