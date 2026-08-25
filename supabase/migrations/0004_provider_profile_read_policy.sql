-- Allow the catalog join to read display profiles for active barbers only.
-- The existing users_read_self policy continues to allow each user to read their own row.
drop policy if exists users_read_active_barber_profile on public.users;

create policy users_read_active_barber_profile
  on public.users
  for select
  to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1
        from public.barbers
       where barbers.id = users.id
         and barbers.active
    )
  );

-- No INSERT, UPDATE, or DELETE policy is added; client mutations remain denied.
