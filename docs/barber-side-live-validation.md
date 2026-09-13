# Barber-Side Live Validation

Status: Fixtures ready; authenticated two-client/device execution pending
Last updated: 2026-09-12

## Available Live Accounts

- Customer: `customer.demo@example.com`
- Owning barber: `barber.demo@example.com`
- Studio owner: `owner.demo@example.com` with active Downtown membership
- Platform admin fixture: `admin.demo@example.com` with explicit Downtown membership
- Second-studio barber: `barber.eastside@example.com` with active Eastside membership and two future slots
- Unrelated customer: `customer.unrelated@example.com`

The account fixtures are complete. Passwords are intentionally not recorded here. Two-client/device execution remains pending.

## Checks Ready With Existing Accounts

1. Customer creates a booking for the demo barber.
2. Barber sees only assigned bookings in Today.
3. Barber opens appointment details and uses pending Confirm/Decline.
4. Barber uses confirmed Complete/No-show with the confirmation dialog.
5. Customer sees the resulting status after refresh.
6. Customer and barber open the same booking conversation.
7. Message retry reuses the same logical idempotency key.
8. Barber adds/removes future availability using native date/time controls.
9. A booked slot cannot be removed.
10. A duplicate or overlapping availability slot is rejected.

## Checks Blocked By Missing Fixtures

- Customer cannot mutate provider status.
- Barber A cannot read or mutate Barber B's booking.
- Owner can manage authorized studio bookings.
- Admin scope is explicitly verified.
- Inactive membership loses access immediately.
- Cross-studio reads and writes are denied.
- Unrelated customer cannot read or send in a booking conversation.

## Checks Requiring Two Clients

- Two customers reserve one slot concurrently: exactly one succeeds.
- Two providers review one pending booking concurrently: one valid transition and one safe retry/conflict.
- Provider removes a slot while a customer attempts to book it.
- Message response is lost after server success, then the same draft is retried.
- Two bookings between the same customer and barber keep separate unread state.

## Required Fixture Decision

Create, in a disposable or explicitly test project:

- A second customer.
- A second barber in another studio.
- An owner with active membership in the demo studio.
- An admin with explicit intended scope.
- A customer unrelated to the booking.

Do not share passwords in chat or commit them to the repository. Enter credentials directly into the app or Supabase dashboard.

## Fixture Setup SQL

After creating the additional Auth users manually in **Authentication > Users**, run this SQL in the Supabase SQL Editor. Replace the email values only if you used different test addresses. This changes application profiles and memberships; it does not create Auth users or passwords.

```sql
do $$
declare
	owner_id uuid;
	admin_id uuid;
begin
	select id into owner_id from auth.users where email = 'owner.demo@example.com';
	select id into admin_id from auth.users where email = 'admin.demo@example.com';

	if owner_id is not null then
		insert into public.users (id, display_name, role)
		values (owner_id, 'Studio Owner Demo', 'owner')
		on conflict (id) do update set display_name = excluded.display_name, role = excluded.role;
		insert into public.studio_memberships (studio_id, user_id, membership_role, active)
		values ('10000000-0000-4000-8000-000000000001', owner_id, 'owner', true)
		on conflict (studio_id, user_id) do update set membership_role = excluded.membership_role, active = true;
	end if;

	if admin_id is not null then
		insert into public.users (id, display_name, role)
		values (admin_id, 'Platform Admin Demo', 'admin')
		on conflict (id) do update set display_name = excluded.display_name, role = excluded.role;
		insert into public.studio_memberships (studio_id, user_id, membership_role, active)
		values ('10000000-0000-4000-8000-000000000001', admin_id, 'admin', true)
		on conflict (studio_id, user_id) do update set membership_role = excluded.membership_role, active = true;
	end if;
end;
$$;
```

The second-studio barber and unrelated customer require Auth users first. The second-studio barber also needs a seeded second studio barber record before cross-studio checks can run. Owner/admin profiles and Downtown memberships are now provisioned and verified.

## Evidence To Record

For each check, record account role, route, booking/slot/conversation ID, timestamp, expected result, actual result, and severity. Never record passwords, access tokens, anon keys, service-role keys, or database passwords.
