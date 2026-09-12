# FS-011 Authorization And Concurrency Checks

## Local coverage

- `tests/booking-status.test.ts` verifies the local state machine rejects invalid status transitions and allows the currently supported transitions.
- `tests/supabase-message-repository.test.ts` verifies message idempotency keys are forwarded unchanged on every request; deduplication remains server-owned.
- `tests/supabase-migration-contract.test.ts` protects the SQL invariants for active-slot uniqueness, actor-scoped booking idempotency, provider/studio/admin review scope, booking status guards, and message authorization/idempotency.
- Repository adapter tests verify booking and message RPC names and arguments, but cannot prove database authorization or transaction behavior.

## Live Supabase checks still required

Run against a disposable project with separate customer, barber, owner/admin, second-studio barber, and unrelated customer accounts:

1. A customer attempts `update_booking_status` for a booking and receives authorization denied for both `confirmed` and `declined`.
2. A barber from another studio attempts to review the booking and receives authorization denied; the owning barber, studio owner/admin, and platform admin are each allowed according to the deployed policy.
3. Submit the same booking request concurrently with the same idempotency key. Confirm one booking is returned on retries and no duplicate booking is created.
4. Submit two different customer requests concurrently for the same slot. Confirm exactly one succeeds and the other receives the slot conflict.
5. Submit the same message request twice with one idempotency key. Confirm one message exists. Reuse that key with a different body and confirm the request is rejected.
6. Attempt to list or send messages for a conversation outside the actor's booking/studio relationship and confirm access is denied.
7. Record the applied migration version, run the migration status check, and rehearse restoring the disposable database before promoting changes.

These checks require a live Postgres/Supabase environment and are intentionally not replaced with a fake integration harness in the local Vitest suite.