# Fade Society Incident Runbook

Status: Internal pilot baseline, not a production operations system
Last updated: 2026-09-12

This runbook describes first response for the current Supabase-backed demo. It is intentionally operational documentation, not a claim that crash reporting, uptime monitoring, alerting, or on-call automation is implemented.

## Safety Rules

- Never log or paste passwords, anon keys, service-role keys, database passwords, access tokens, session tokens, or App Store Connect credentials.
- Record environment, route, account role, booking/message IDs, migration version, timestamp, and user-visible error text. IDs are useful; credentials are not.
- Prefer the smallest reproducible action. Do not reset or delete live data while investigating.
- Keep `master` stable and use `test-com/development` for fixes.

## First Response

1. Capture the exact user-visible error and route.
2. Record whether the failure occurred in local or Supabase mode.
3. Record account role and project reference, never secret values.
4. Check the development branch and Supabase migration ledger.
5. Reproduce with the smallest safe test account and booking.
6. If data integrity or authorization is uncertain, stop the workflow and escalate before changing SQL.

## Auth And Session Failures

Symptoms:

- Sign-in or sign-up fails.
- The app remains on account bootstrap or returns to sign-in unexpectedly.
- Authenticated profile or role cannot be loaded.

Checks:

```powershell
npx supabase migration list
npx tsc --noEmit
npm run lint
npm test -- --run
```

Capture:

- Auth route and operation: sign-in, sign-up, sign-out, or bootstrap.
- User role and whether the email is confirmed.
- Readable error message and timestamp.

Never solve an auth problem by changing a user's role from the client.

## Booking Failures

Symptoms:

- Availability is empty.
- Confirm request times out or returns an RPC error.
- Duplicate or conflicting bookings appear.
- Provider Confirm/Decline/Complete/No-show fails.

Checks:

- Verify the selected slot is future, active, and belongs to the selected barber.
- Verify migrations through `0015` are applied.
- Check the booking status, customer ID, barber ID, studio ID, and availability slot ID.
- Check the user role and studio membership before changing authorization.
- Do not reopen a booked slot manually.

Expected server protections:

- Booking creation is idempotent and slot-protected.
- Provider status changes are role and studio scoped.
- Customer cancellation/rescheduling is ownership and cutoff scoped.
- Audit events record booking status changes and customer changes.

## Messaging Failures

Symptoms:

- Messages shows an unavailable or unauthorized state.
- A booking conversation is missing.
- Send or mark-read fails.

Checks:

- Verify a booking-linked conversation exists with the expected two members.
- Verify `list_my_messages`, `send_message`, and `mark_conversation_read` exist.
- Verify the actor is a conversation member and authorized through the booking/studio relationship.
- Use the app Retry action before repeating a send manually.
- Preserve the same idempotency key when diagnosing a retry; do not invent a different key to bypass a suspected duplicate.

## Migration And Environment Verification

From the repository root:

```powershell
npm run supabase:migrations
npx supabase db query --linked "select current_database(), now();"
```

Confirm the local and remote migration versions match. The current repository migration range is `0001` through `0015`.

Public client configuration may contain only:

```text
EXPO_PUBLIC_DATA_MODE
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
```

Service-role keys, database passwords, and private signing keys must remain outside the Expo client.

## Current Operational Gaps

Not implemented yet:

- Crash reporting integration
- Central structured logging sink
- Uptime monitor and synthetic booking check
- Alert routing and on-call escalation
- Production incident ticket automation
- Load/performance testing and capacity thresholds
- Automated migration rollback rehearsal

These gaps must be closed before a public paid marketplace launch.

## Escalation Record

For each incident, record:

- Date/time and environment
- Route and account role
- Reproduction steps
- User-visible message
- Booking, slot, conversation, or migration identifier if applicable
- Impact and affected workflow
- Immediate mitigation
- Follow-up story ID
