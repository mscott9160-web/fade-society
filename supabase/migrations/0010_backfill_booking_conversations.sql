-- Backfill conversations for bookings created before the conversation trigger existed.
insert into public.conversations (booking_id)
select b.id
from public.bookings b
where not exists (select 1 from public.conversations c where c.booking_id = b.id);

insert into public.conversation_members (conversation_id, user_id)
select c.id, b.customer_id
from public.conversations c
join public.bookings b on b.id = c.booking_id
where not exists (select 1 from public.conversation_members member where member.conversation_id = c.id and member.user_id = b.customer_id);

insert into public.conversation_members (conversation_id, user_id)
select c.id, b.barber_id
from public.conversations c
join public.bookings b on b.id = c.booking_id
where not exists (select 1 from public.conversation_members member where member.conversation_id = c.id and member.user_id = b.barber_id);
