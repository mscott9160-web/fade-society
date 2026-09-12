# Barber-Side Live Validation

Status: Blocked on test fixtures and two-client execution
Last updated: 2026-09-12

## Available Live Accounts

- Customer: `customer.demo@example.com`
- Owning barber: `barber.demo@example.com`

The current project does not yet contain owner/admin, second-studio barber, or unrelated-customer fixtures. Passwords are intentionally not recorded here.

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

## Evidence To Record

For each check, record account role, route, booking/slot/conversation ID, timestamp, expected result, actual result, and severity. Never record passwords, access tokens, anon keys, service-role keys, or database passwords.
