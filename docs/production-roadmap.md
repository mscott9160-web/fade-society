# Fade Society Production Roadmap

Status: Internal demo, not approved for public launch
Owner: Aurora Labs product team
Last updated: 2026-08-16

## Release Gates

Fade Society must not launch as a public paid marketplace until the following are true:

- A backend is the source of truth for users, studios, services, availability, bookings, messages, and payments.
- Authentication and server-side role/studio authorization are enforced.
- Booking creation is atomic, idempotent, timezone-aware, and protected from double booking.
- Payment, deposits, fees, refunds, taxes, receipts, and payout rules are implemented and tested.
- Cancellation, reschedule, no-show, dispute, and support workflows are documented and operational.
- Privacy policy, terms, provider agreement, community rules, data deletion, and data request processes are published.
- Providers can manage schedules and bookings; owners can manage team and studio operations.
- Notifications, messaging, crash reporting, monitoring, analytics, and incident response are ready.
- iOS and Android production builds pass device, accessibility, performance, and store review checks.

## Phases

### Phase 1: Foundation and Demo Safety
Status: Complete

Goal: Make the current demo coherent, testable, and safe to extend.

- [x] Consolidate route ownership around `src/app`.
- [x] Add typed domain models and stable IDs.
- [x] Move booking mutations behind typed store functions.
- [x] Add validated local state hydration and persistence fallback.
- [x] Add ESLint and focused booking-store tests.
- [x] Add primary-flow accessibility labels and selected states.
- [x] Add production/demo mode labeling and remove misleading live claims.
- [x] Add resettable demo data action for presentations.
- [x] Document current demo limitations and manual test path.
- [x] Add CI-friendly quality command documentation.

Exit criteria: typecheck, lint, tests, and iOS export pass; a stakeholder can reset and replay the demo without mistaking local data for a real booking.

### Phase 2: Trustworthy Customer Booking UX
Status: In progress

Goal: Make one customer booking journey clear and trustworthy before backend work.

- [x] Add service duration, price breakdown, location, hours, and cancellation policy.
- [x] Add booking review and confirmation reference UI.
- [x] Add dedicated booking confirmation and support entry point.
- [x] Make Messages a usable booking-linked conversation flow.
- [x] Add report-problem action in conversations.
- [x] Add pending/declined/failed status model and guarded local transitions.
- [x] Add explicit cancellation confirmation and recovery actions.
- [x] Add global persistence error/recovery notice.
- [x] Add pending/confirmed/declined/failed states.
- [x] Add loading and persistence recovery states to the primary flow.
- [x] Make Messages a usable booking-linked conversation flow.
- [x] Add customer support and report-problem entry points.
- [ ] Add accessibility audit for VoiceOver, TalkBack, Dynamic Type, and contrast.

Exit criteria: a first-time customer completes the flow in under 90 seconds without facilitator help.

### Phase 3: Backend and Authentication
Status: In progress

Goal: Establish server authority and real account identity.

- [x] Select Supabase/PostgreSQL/Auth/Edge Functions as the backend foundation.
- [x] Define API/database contracts and migrations.
- [x] Add the initial Supabase schema and server authorization scaffold.
- [x] Add the transactional booking RPC scaffold and booking rules contract.
- [x] Define typed repository boundaries for catalog, bookings, messages, and sessions.
- [ ] Implement users, studios, barbers, services, availability, bookings, messages.
- [ ] Implement secure authentication, sessions, recovery, and account deletion.
- [ ] Enforce role and studio authorization server-side.
- [ ] Add repository adapters and replace local demo repository behind a feature flag.
- [ ] Add integration, authorization, migration, and concurrency tests.

Exit criteria: two devices see the same booking state and unauthorized mutations are rejected.

### Phase 4: Provider and Owner Operations
Status: Planned

Goal: Deliver concrete value to the supply side.

- [ ] Barber Today view with accept/decline/complete actions.
- [ ] Availability editor with working hours, breaks, blackout dates, and buffers.
- [ ] Client and appointment details.
- [ ] Owner studio overview, team, chairs, utilization, cancellations, and reports.
- [ ] Provider onboarding and business verification workflow.
- [ ] Provider agreement and support operations.

Exit criteria: a provider can receive, manage, and complete a real booking without admin intervention.

### Phase 5: Payments and Marketplace Operations
Status: Planned

Goal: Safely handle money and marketplace exceptions.

- [ ] Select payment provider and deposit model.
- [ ] Implement payment intents, webhooks, receipts, refunds, and payout records.
- [ ] Add idempotency and reconciliation jobs.
- [ ] Define taxes, fees, tips, discounts, chargebacks, and no-show rules.
- [ ] Add customer/provider dispute flows.
- [ ] Add financial audit logs and admin support tools.

Exit criteria: sandbox payment, failure, refund, webhook retry, and reconciliation scenarios pass.

### Phase 6: Production Operations and Release
Status: Planned

Goal: Operate the application safely at pilot scale and release gradually.

- [ ] Add analytics funnel and marketplace success metrics.
- [ ] Add crash reporting, structured logs, alerts, uptime checks, and incident runbook.
- [ ] Add dependency/security scanning and secret scanning.
- [ ] Add protected CI/CD with preview, internal, and production builds.
- [ ] Verify iOS and Android identifiers, signing, privacy disclosures, notifications, and deep links.
- [ ] Run closed beta with verified providers and manual support.
- [ ] Define rollout, rollback, and go/no-go thresholds.

Exit criteria: closed beta completes without unresolved P0/P1 issues and launch metrics meet the approved thresholds.

## Current Non-Goals

- Do not add more social-feed breadth before booking and provider operations are reliable.
- Do not treat client-controlled demo roles as authorization.
- Do not accept real customer payments until Phase 5 is complete.
- Do not present seeded catalog, availability, ratings, or queue values as live marketplace data.
