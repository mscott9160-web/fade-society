-- Allow providers to read the customer display name for their authorized bookings.
drop policy if exists users_read_customer_booking_profile on public.users;

create policy users_read_customer_booking_profile
  on public.users
  for select
  to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1
        from public.bookings
       where bookings.customer_id = users.id
         and (
           bookings.barber_id = auth.uid()
           or exists (
             select 1
               from public.studio_memberships
              where studio_memberships.studio_id = bookings.studio_id
                and studio_memberships.user_id = auth.uid()
           )
         )
    )
  );
