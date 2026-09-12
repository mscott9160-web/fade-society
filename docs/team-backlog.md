# Fade Society Team Backlog

Status: Active delivery backlog
Owner: Aurora Labs product team
Last updated: 2026-09-12

This backlog turns the next product improvements into executable stories. Stories are ordered by dependency and user value. The app is still an internal demo and is not approved for public launch.

## Barber-Side Review Stream

The barber-side team review agreed that Find/Explore remains customer-only. The provider workflow should be organized around running the day: Today, Messages, Profile, appointment details, availability, and authorized studio scope.

### BP-001: Provider Navigation And Action Parity

- Owner: Frontend / UX
- Priority: P0
- Status: Complete
- Depends on: FS-005, FS-010

As a barber, I want predictable access to Today, Messages, and Profile, and I want appointment details to expose the actions valid for the booking status.

Acceptance criteria:

- Barber, owner, and admin navigation shows Today, Messages, and Profile.
- Find/Explore remains customer-only.
- Pending appointment details show Confirm and Decline.
- Confirmed appointment details show Complete and No-show.
- Terminal statuses are read-only with clear explanation.
- Today and details share loading, timeout, error, success, and retry behavior.
- Provider conversation entry preserves booking context.
- Native and web navigation expose equivalent provider destinations.

Implementation note: provider navigation now exposes Today, Messages, and Profile while keeping Find/Explore customer-only. Appointment details mirror status-valid actions with bounded feedback.

### BP-002: Provider-Scoped Booking Read Model

- Owner: Backend / Architecture
- Priority: P0
- Status: Complete
- Depends on: BP-001

As a provider, I want booking reads to match my authorized barber/studio scope so that the UI never relies on broad table reads or stale client role assumptions.

Acceptance criteria:

- Barber sees only assigned bookings.
- Owner/admin sees only authorized studio bookings.
- Cross-studio reads and deep links are denied.
- Provider list and detail use explicit server-authorized RPCs.
- Customer booking reads remain separate from provider reads.
- Scope is deterministic, ordered, and refreshable.

Implementation note: migration `0016_provider_booking_read_model.sql` provides explicit provider list/detail RPCs. Barber scope is assigned-booking only; owner/admin scope requires active studio membership. Platform-wide admin scope remains intentionally disabled.

### BP-003: Safe Provider Status Transitions

- Owner: Backend / QA
- Priority: P0
- Status: Complete
- Depends on: BP-002

As a provider, I want status actions to be safe when retried or used concurrently so that a network failure cannot create contradictory appointment state.

Acceptance criteria:

- Barber can mutate only their own bookings; owner/admin scope is explicit.
- Same-target retries are idempotent.
- Conflicting terminal transitions remain rejected.
- Concurrent review produces one valid state transition and one audit event.
- Customer/provider views converge after refresh.

Implementation note: migration `0017_safe_provider_status_transitions.sql` narrows barber mutations to assigned bookings, requires active owner/admin membership, preserves conflicting-transition rejection, and makes same-target retries return without duplicate audit events.

### BP-004: Provider Messages As A First-Class Workflow

- Owner: Frontend / Backend
- Priority: P0
- Status: Complete
- Depends on: BP-001, BP-002

As a barber, I want a direct message inbox with booking context so that customer communication does not depend on opening Today first.

Acceptance criteria:

- Provider Messages is a primary navigation destination.
- Unread state is visible and accessible.
- Every authorized booking exposes Message customer.
- Empty booking threads can be started.
- Conversation identity uses conversation ID, not only participant ID.
- Read state is scoped to one booking conversation.
- Message retries reuse a stable idempotency key.

Implementation note: migration `0018_conversation_first_class_messaging.sql` makes conversation ID first-class, scopes read state to one conversation, and preserves one logical send idempotency key across retries.

### BP-005: Run My Day Schedule

- Owner: Frontend / UX
- Priority: P0
- Status: Complete
- Depends on: BP-002, BP-003

As a barber, I want a chronological day view so that I can identify my next appointment and unresolved work within seconds.

Acceptance criteria:

- Pending requests remain prioritized.
- Confirmed appointments are grouped by date and ordered by time.
- Today, next, later, completed, cancelled, and no-show states are distinct.
- Counts and next appointment are visible without scanning every card.
- Refresh and last-updated state are clear.
- Long names, prices, and actions remain usable with larger text.

Implementation note: Today now has scoped refresh, last-updated feedback, counts, next appointment summary, date navigation, relative date labels, and separate pending/schedule empty states.

### BP-006: Provider Appointment Readiness

- Owner: Frontend / UX
- Priority: P1
- Status: In progress
- Depends on: BP-001, BP-004

As a barber, I want authorized customer and service context so that I can prepare for the appointment without exposing unrelated personal data.

Acceptance criteria:

- Details show customer, service, duration, price, time, studio, status, and confirmation code.
- Authorized notes/preferences are visible when the model supports them.
- Message customer is always available for an authorized booking.
- Missing service/customer data has explicit loading/error/fallback states.
- Customer contact data is limited to booking context.

### BP-007: Schedule-Based Availability

- Owner: Backend / Frontend
- Priority: P1
- Status: Planned
- Depends on: BP-002, BP-003

As a barber, I want schedule-oriented availability management so that I do not type every slot manually.

Acceptance criteria:

- Native date/time controls replace free-form entry.
- Timezone is explicit.
- Overlapping slots are rejected server-side.
- Booked slots cannot be reopened or removed.
- Removal is confirmed and audited.
- Recurring hours, breaks, blackout dates, and buffers have explicit scope or are clearly deferred.
- Customer availability reflects provider changes after refresh.

### BP-008: Provider Identity And Settings

- Owner: Frontend / UX
- Priority: P1
- Status: Planned
- Depends on: BP-005, BP-007

As a barber, I want Profile and Settings to reflect my provider identity and studio context so that the app does not feel like a customer screen with hidden tools.

Acceptance criteria:

- Provider name, role, and studio context are visible.
- Profile links to Today, Messages, Availability, and Settings.
- Metrics use provider language.
- Owner/admin scope is distinguishable from barber scope.
- Sign out and accessibility controls remain reachable.

### BP-009: Provider Exception Recovery

- Owner: Backend / Provider / QA
- Priority: P1
- Status: Planned
- Depends on: BP-003, BP-004

As a provider, I want safe recovery for late, cancelled, no-show, and incorrectly updated appointments so that common disruptions do not require support intervention.

Acceptance criteria:

- No-show has confirmation, grace-period guidance, and optional reason.
- Incorrect status changes have a documented correction path.
- Customer/provider receive consistent resulting state.
- Audit events capture actor, previous state, resulting state, and reason when supplied.

### BP-010: Barber-Side Live Validation Matrix

- Owner: QA / Backend
- Priority: P0
- Status: Planned
- Depends on: BP-002, BP-003, BP-004, BP-007

As the team, we want live multi-account and device evidence that the barber workflow is authorized, concurrent-safe, and usable.

Acceptance criteria:

- Owning barber, other barber, owner/admin, customer, and cross-studio cases are tested.
- Booking and availability races are tested with two clients.
- Message retry/read scope is tested with two bookings involving the same participants.
- VoiceOver, larger text, browser keyboard, and dark/light mode are tested on target devices.
- Findings include route, role, device, reproduction steps, severity, and owner.

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
- Status: Complete
- Depends on: FS-001

As a customer or provider, I want clear feedback after a booking action so that I know whether the request succeeded, failed, or is still processing.

Acceptance criteria:

- Confirm and Decline show a submitting state and cannot be double-tapped.
- Success feedback names the resulting status.
- Failure feedback displays a readable server message and a retry path.
- Pending, confirmed, declined, and failed states have distinct explanatory copy.
- No action leaves an indefinite spinner.

Implementation note: booking submission, provider review, confirmation lookup, cancellation, and rescheduling have bounded loading states and readable retry feedback.

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
- Status: Complete
- Depends on: FS-001

As a customer or barber, I want every booking to have a visible conversation so that I can contact the other participant without searching.

Acceptance criteria:

- A conversation appears for a new booking before the first message is sent.
- The thread shows booking context, participant identity, and latest message state.
- Customer and barber can send messages in the same thread.
- Read state updates for the active participant.
- Empty, loading, send-failure, and unauthorized states are readable.
- Repeating a send request with the same idempotency key does not duplicate a message.

Implementation note: the current list RPC exposes one latest row per conversation; full message history remains a separate backend story. Empty booking-linked threads are visible before the first message.

## Sprint 2: Make Provider Operations Dependable

Sprint goal: complete the provider workflow around the working Today view.

### FS-005: Provider Appointment Details

- Owner: Frontend / UX
- Priority: P1
- Status: Complete
- Depends on: FS-003, FS-004

As a barber, I want appointment details and customer context so that I can prepare for the service.

Acceptance criteria:

- Details include customer identity, service duration, price, studio, and booking status.
- The barber can open the booking conversation from the appointment.
- Customer contact data is limited to the authorized booking context.
- Access to another studio's booking is rejected by the server.

Implementation note: Today cards now open the provider detail route on native and web; the native route is registered as hidden navigation. Customer conversation context is preserved through booking IDs.

### FS-006: Complete And No-Show Actions

- Owner: Backend / Provider
- Priority: P1
- Status: Complete
- Depends on: FS-003

As a barber, I want to mark an appointment completed or no-show so that booking history is accurate.

Acceptance criteria:

- Only valid status transitions are accepted server-side.
- Only authorized provider members can mutate the booking.
- Each mutation creates an audit event.
- Customer and provider views converge after refresh.
- Duplicate requests are safe.

Implementation note: provider completion and no-show transitions are live through migration `0013_provider_completion_status.sql`; audit metadata records both previous and resulting status.

### FS-007: Availability Editor

- Owner: Backend / Frontend
- Priority: P1
- Status: Complete
- Depends on: FS-006

As a barber, I want to manage future availability so that customers see accurate appointment times.

Acceptance criteria:

- Provider can add and remove future slots within authorized studio scope.
- Booked slots cannot be removed or reopened.
- Timezone is explicit and consistent between provider and customer views.
- Customer availability refreshes after provider changes.
- Concurrent booking and slot edits cannot create double bookings.

Implementation note: the scoped editor supports authorized future slot add/remove with explicit timestamptz RPCs and booked-slot protection. Recurring hours, breaks, blackout dates, and buffers remain future extensions.

## Sprint 3: Trust, Recovery, And Accessibility

Sprint goal: make failure and accessibility states as reliable as the happy path.

### FS-008: Customer Cancellation And Reschedule

- Owner: Backend / Frontend
- Priority: P1
- Status: Complete
- Depends on: FS-006, FS-007

As a customer, I want to cancel or reschedule within policy so that I can recover from schedule changes.

Acceptance criteria:

- Policy and cutoff are enforced server-side.
- A cancelled slot is not silently reopened unless policy allows it.
- Rescheduling is atomic and idempotent.
- Provider and customer receive the same resulting status.

Implementation note: migration `0015_customer_booking_changes.sql` is live. Customer actions use atomic server RPCs with the documented 24-hour cutoff; live rescheduling uses the barber's available slots.

### FS-009: Accessibility Audit

- Owner: QA / UX
- Priority: P1
- Status: In progress
- Depends on: FS-001, FS-002, FS-003

As a customer using assistive technology, I want the primary journey to remain understandable and operable.

Acceptance criteria:

- VoiceOver labels, focus order, hints, and selected/disabled states are checked on iPhone.
- Dynamic Type or the larger-text setting does not clip or overlap content.
- Contrast is checked for light mode, dark mode, status tones, and disabled controls.
- TalkBack/web keyboard gaps are documented or fixed.
- Findings are recorded with severity and reproduction steps.

Progress note: static fixes and audit report are complete in [docs/accessibility-audit.md](accessibility-audit.md). Story remains open until VoiceOver/TalkBack, browser keyboard, and contrast checks are performed on target devices.

### FS-010: Error And Recovery Consistency

- Owner: Frontend / QA
- Priority: P1
- Status: Complete with target validation pending
- Depends on: FS-002, FS-004

As a user, I want errors to explain what happened and what I can do next.

Acceptance criteria:

- Structured backend errors never render as `[object Object]`.
- Every network-backed screen has loading, empty, error, and retry behavior where applicable.
- Auth expiry routes to sign-in without losing unrelated local demo data.
- Errors are accessible to screen readers.

Implementation note: shared structured-error normalization, Messages retry, bounded Availability loading, and retry-oriented booking/provider feedback are implemented. Target-device auth subscription recovery and a standalone Availability Retry button remain validation/follow-up gaps documented in the sprint kickoff.

## Sprint 4: Release Readiness Foundations

Sprint goal: add the safeguards needed before payments or a closed beta.

### FS-011: Authorization And Concurrency Test Matrix

- Owner: QA / Backend
- Priority: P0
- Status: Complete with live validation pending
- Depends on: FS-004, FS-006, FS-007

As the team, we want executable authorization and concurrency checks so that backend behavior is trustworthy.

Acceptance criteria:

- Customer cannot confirm or decline a booking.
- Barber cannot mutate another studio's booking.
- Owner/admin scope is explicitly tested.
- Duplicate booking and message retries are tested.
- Two attempts to reserve one slot result in one successful booking.
- Migration status and rollback/recovery notes are documented.

Implementation note: local coverage now includes 68 tests across 12 files, including booking transition, message retry forwarding, and SQL contract invariants. Live multi-user authorization/concurrency checks remain documented in [docs/fs-011-authorization-concurrency-checks.md](fs-011-authorization-concurrency-checks.md) and require a disposable Supabase environment.

### FS-012: Observability And Support Baseline

- Owner: Platform / QA
- Priority: P1
- Status: Complete with capability gaps tracked
- Depends on: FS-010, FS-011

As the team, we want enough operational evidence to diagnose failures during a pilot.

Acceptance criteria:

- Auth, booking, status mutation, and message failures produce structured diagnostic context without secrets.
- A basic incident/runbook page exists.
- Supabase migration and environment checks are documented.
- Crash reporting, uptime, and alerting gaps are explicitly tracked.

Implementation note: [docs/incident-runbook.md](incident-runbook.md) now documents safe diagnostics, migration/environment verification, and current observability gaps. The runbook does not claim crash reporting, uptime monitoring, alerting, or on-call automation are implemented.

## Definition Of Done

A story is complete when:

- Acceptance criteria are demonstrated on the intended platform.
- Relevant unit, contract, authorization, or integration tests pass.
- `npx tsc --noEmit`, `npm run lint`, and `npm test -- --run` pass.
- Supabase migrations are applied and verified when the story changes backend behavior.
- README, roadmap, or operational docs are updated when scope/status changes.
- The development branch is pushed and the worktree is clean.
