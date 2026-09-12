# Fade Society Team Backlog

Status: Active delivery backlog
Owner: Aurora Labs product team
Last updated: 2026-09-12

This backlog turns the next product improvements into executable stories. Stories are ordered by dependency and user value. The app is still an internal demo and is not approved for public launch.

## Working Agreements

- The server owns identity, roles, studio membership, pricing, availability, booking state, and message authorization.
- Every story must preserve local demo mode and Supabase mode unless the story explicitly changes one mode.
- A story is not done until its acceptance criteria and relevant quality checks pass.
- UI stories must be checked at narrow iPhone width, larger text, dark mode, and web width when applicable.
- Do not add payments, notifications, or marketplace growth features before booking, provider operations, and release safeguards are stable.

## Sprint 1: Make The Working Flow Feel Finished

Sprint goal: polish the customer/provider workflow without changing its working backend behavior.

### FS-001: Role-Aware Navigation Polish

- Owner: Frontend / UX
- Priority: P0
- Status: Complete
- Depends on: None

As a signed-in user, I want navigation to reflect my role so that customer and provider jobs are easy to find.

Acceptance criteria:

- Customer accounts see customer navigation and do not see provider-only Today navigation.
- Barber, owner, and admin accounts see Today with a clear active state.
- Settings shows the signed-in display name and role.
- Sign out remains reachable from Settings on native and web.
- No duplicate Explore/Find destinations appear.
- TypeScript, lint, tests, and a web export pass.

Implementation note: authenticated Supabase sign-out is complete. Local demo mode retains its intentional no-op sign-out behavior because it has no authenticated session.

### FS-002: Booking Status Feedback

- Owner: Frontend / UX
- Priority: P0
- Status: In progress
- Depends on: FS-001

As a customer or provider, I want clear feedback after a booking action so that I know whether the request succeeded, failed, or is still processing.

Acceptance criteria:

- Confirm and Decline show a submitting state and cannot be double-tapped.
- Success feedback names the resulting status.
- Failure feedback displays a readable server message and a retry path.
- Pending, confirmed, declined, and failed states have distinct explanatory copy.
- No action leaves an indefinite spinner.

### FS-003: Today Appointment Card Hierarchy

- Owner: Frontend / UX
- Priority: P0
- Status: Complete
- Depends on: FS-001

As a barber, I want appointment cards to expose the important information first so that I can review requests quickly.

Acceptance criteria:

- Cards show customer, service, time, price, and status without clipping.
- Pending requests place Confirm and Decline actions together and visibly.
- Confirmed appointments show a clear next action or read-only state.
- Long names and larger text wrap without overlap.
- Empty, loading, and error states are intentionally designed.

Implementation note: provider customer display-name access is enforced by migration `0012_provider_customer_profile_read_policy.sql`; older records use an intentional `Customer` fallback when no name is available.

### FS-004: Booking-Linked Messaging UX

- Owner: Frontend / Backend
- Priority: P0
- Status: In progress
- Depends on: FS-001

As a customer or barber, I want every booking to have a visible conversation so that I can contact the other participant without searching.

Acceptance criteria:

- A conversation appears for a new booking before the first message is sent.
- The thread shows booking context, participant identity, and latest message state.
- Customer and barber can send messages in the same thread.
- Read state updates for the active participant.
- Empty, loading, send-failure, and unauthorized states are readable.
- Repeating a send request with the same idempotency key does not duplicate a message.

## Sprint 2: Make Provider Operations Dependable

Sprint goal: complete the provider workflow around the working Today view.

### FS-005: Provider Appointment Details

- Owner: Frontend / UX
- Priority: P1
- Status: Planned
- Depends on: FS-003, FS-004

As a barber, I want appointment details and customer context so that I can prepare for the service.

Acceptance criteria:

- Details include customer identity, service duration, price, studio, and booking status.
- The barber can open the booking conversation from the appointment.
- Customer contact data is limited to the authorized booking context.
- Access to another studio's booking is rejected by the server.

### FS-006: Complete And No-Show Actions

- Owner: Backend / Provider
- Priority: P1
- Status: Planned
- Depends on: FS-003

As a barber, I want to mark an appointment completed or no-show so that booking history is accurate.

Acceptance criteria:

- Only valid status transitions are accepted server-side.
- Only authorized provider members can mutate the booking.
- Each mutation creates an audit event.
- Customer and provider views converge after refresh.
- Duplicate requests are safe.

### FS-007: Availability Editor

- Owner: Backend / Frontend
- Priority: P1
- Status: Planned
- Depends on: FS-006

As a barber, I want to manage future availability so that customers see accurate appointment times.

Acceptance criteria:

- Provider can add and remove future slots within authorized studio scope.
- Booked slots cannot be removed or reopened.
- Timezone is explicit and consistent between provider and customer views.
- Customer availability refreshes after provider changes.
- Concurrent booking and slot edits cannot create double bookings.

## Sprint 3: Trust, Recovery, And Accessibility

Sprint goal: make failure and accessibility states as reliable as the happy path.

### FS-008: Customer Cancellation And Reschedule

- Owner: Backend / Frontend
- Priority: P1
- Status: Planned
- Depends on: FS-006, FS-007

As a customer, I want to cancel or reschedule within policy so that I can recover from schedule changes.

Acceptance criteria:

- Policy and cutoff are enforced server-side.
- A cancelled slot is not silently reopened unless policy allows it.
- Rescheduling is atomic and idempotent.
- Provider and customer receive the same resulting status.

### FS-009: Accessibility Audit

- Owner: QA / UX
- Priority: P1
- Status: Ready
- Depends on: FS-001, FS-002, FS-003

As a customer using assistive technology, I want the primary journey to remain understandable and operable.

Acceptance criteria:

- VoiceOver labels, focus order, hints, and selected/disabled states are checked on iPhone.
- Dynamic Type or the larger-text setting does not clip or overlap content.
- Contrast is checked for light mode, dark mode, status tones, and disabled controls.
- TalkBack/web keyboard gaps are documented or fixed.
- Findings are recorded with severity and reproduction steps.

### FS-010: Error And Recovery Consistency

- Owner: Frontend / QA
- Priority: P1
- Status: Planned
- Depends on: FS-002, FS-004

As a user, I want errors to explain what happened and what I can do next.

Acceptance criteria:

- Structured backend errors never render as `[object Object]`.
- Every network-backed screen has loading, empty, error, and retry behavior where applicable.
- Auth expiry routes to sign-in without losing unrelated local demo data.
- Errors are accessible to screen readers.

## Sprint 4: Release Readiness Foundations

Sprint goal: add the safeguards needed before payments or a closed beta.

### FS-011: Authorization And Concurrency Test Matrix

- Owner: QA / Backend
- Priority: P0
- Status: Ready
- Depends on: FS-004, FS-006, FS-007

As the team, we want executable authorization and concurrency checks so that backend behavior is trustworthy.

Acceptance criteria:

- Customer cannot confirm or decline a booking.
- Barber cannot mutate another studio's booking.
- Owner/admin scope is explicitly tested.
- Duplicate booking and message retries are tested.
- Two attempts to reserve one slot result in one successful booking.
- Migration status and rollback/recovery notes are documented.

### FS-012: Observability And Support Baseline

- Owner: Platform / QA
- Priority: P1
- Status: Planned
- Depends on: FS-010, FS-011

As the team, we want enough operational evidence to diagnose failures during a pilot.

Acceptance criteria:

- Auth, booking, status mutation, and message failures produce structured diagnostic context without secrets.
- A basic incident/runbook page exists.
- Supabase migration and environment checks are documented.
- Crash reporting, uptime, and alerting gaps are explicitly tracked.

## Definition Of Done

A story is complete when:

- Acceptance criteria are demonstrated on the intended platform.
- Relevant unit, contract, authorization, or integration tests pass.
- `npx tsc --noEmit`, `npm run lint`, and `npm test -- --run` pass.
- Supabase migrations are applied and verified when the story changes backend behavior.
- README, roadmap, or operational docs are updated when scope/status changes.
- The development branch is pushed and the worktree is clean.
