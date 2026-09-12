-- Provision a customer/provider conversation for every new booking.
create or replace function public.provision_booking_conversation()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  conversation_id uuid;
begin
  insert into public.conversations (booking_id)
  values (new.id)
  returning id into conversation_id;

  insert into public.conversation_members (conversation_id, user_id)
  values (conversation_id, new.customer_id), (conversation_id, new.barber_id);

  return new;
end;
$$;

drop trigger if exists bookings_provision_conversation on public.bookings;
create trigger bookings_provision_conversation
after insert on public.bookings
for each row execute function public.provision_booking_conversation();

create or replace function public.send_message(p_participant_id uuid, p_body text, p_idempotency_key text)
returns table (id uuid, conversation_id uuid, booking_id uuid, sender_id uuid, participant_id uuid, participant_name text, body text, created_at timestamptz, unread boolean)
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  actor uuid := auth.uid();
  conversation uuid;
  key public.message_idempotency_keys%rowtype;
  new_message public.messages%rowtype;
  hash text;
begin
  if actor is null then raise exception using errcode = '42501', message = 'Authentication required'; end if;
  if p_body is null or length(trim(p_body)) = 0 or length(p_body) > 4000 then raise exception using errcode = '22023', message = 'Message body must contain 1 to 4000 characters'; end if;
  if p_idempotency_key is null or length(trim(p_idempotency_key)) = 0 or length(p_idempotency_key) > 200 then raise exception using errcode = '22023', message = 'A valid idempotency key is required'; end if;

  select c.id into conversation
  from public.conversations c
  join public.conversation_members a on a.conversation_id = c.id and a.user_id = actor
  join public.conversation_members b on b.conversation_id = c.id and b.user_id = p_participant_id
  where public.messaging_actor_can_access(c.id)
  limit 1;
  if conversation is null then raise exception using errcode = '42501', message = 'Conversation access denied'; end if;

  hash := encode(digest(jsonb_build_object('participant_id', p_participant_id, 'body', p_body)::text, 'sha256'), 'hex');
  insert into public.message_idempotency_keys values (actor, trim(p_idempotency_key), hash, null) on conflict do nothing;
  select * into key from public.message_idempotency_keys where actor_id = actor and idempotency_key = trim(p_idempotency_key) for update;
  if key.request_hash <> hash then raise exception using errcode = '22023', message = 'Idempotency key was reused for a different message'; end if;
  if key.message_id is not null then
    new_message := (select m from public.messages m where m.id = key.message_id);
  else
    insert into public.messages(conversation_id, sender_id, body) values (conversation, actor, trim(p_body)) returning * into new_message;
    update public.message_idempotency_keys set message_id = new_message.id where actor_id = actor and idempotency_key = trim(p_idempotency_key);
  end if;

  return query
  select new_message.id, new_message.conversation_id, c.booking_id, new_message.sender_id, other.user_id, u.display_name, new_message.body, new_message.created_at, false
  from public.conversations c
  join public.conversation_members other on other.conversation_id = c.id and other.user_id <> actor
  join public.users u on u.id = other.user_id
  where c.id = new_message.conversation_id;
end;
$$;

create or replace function public.mark_conversation_read(p_participant_id uuid)
returns void language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare conversation uuid;
begin
  select c.id into conversation
  from public.conversations c
  join public.conversation_members a on a.conversation_id = c.id and a.user_id = auth.uid()
  join public.conversation_members b on b.conversation_id = c.id and b.user_id = p_participant_id
  where public.messaging_actor_can_access(c.id)
  limit 1;
  if conversation is null then raise exception using errcode = '42501', message = 'Conversation access denied'; end if;
  insert into public.conversation_read_state values (conversation, auth.uid(), now())
  on conflict (conversation_id, user_id) do update set last_read_at = excluded.last_read_at;
end;
$$;

revoke all on function public.provision_booking_conversation() from public;
revoke all on function public.send_message(uuid, text, text) from public;
revoke all on function public.mark_conversation_read(uuid) from public;
grant execute on function public.send_message(uuid, text, text) to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;
