# Sprint 1 Kickoff: Working Flow Polish

Date: 2026-09-12
Sprint goal: Make the working customer/provider flow feel finished without changing its server-authoritative behavior.

## Baseline

- Development branch: `test-com/development`
- Latest product checkpoint: `f913395 Fix provider booking access and empty threads`
- Supabase migrations: `0001` through `0011` applied
- Quality baseline: TypeScript, ESLint, and 49 tests passing
- Live flows verified: auth, customer booking, barber Today review, booking-linked conversations

## Active Story

### FS-001: Role-Aware Navigation Polish

Owner: Frontend / UX
Status: Complete

First checks:

- Customer account sees Home, Explore, Bookings, Messages, Profile.
- Barber account sees Today and can still reach the account/settings path.
- Owner/admin navigation does not expose customer-only actions as provider actions.
- Settings shows the signed-in identity and role.
- Sign out works on native and web.
- No duplicate Explore/Find destination appears.

Outcome: provider navigation is limited to Today and Profile; customer navigation remains unchanged; Settings now shows the current identity and role. Authenticated Supabase sign-out is available. Local demo sign-out remains intentionally sessionless.

Handoff:

- Frontend: inspect `src/components/app-tabs.tsx`, `src/components/app-tabs.web.tsx`, `src/app/settings.tsx`, and `src/components/customer-tabs.ts`.
- UX: define the intended customer/provider tab hierarchy and states at narrow width and larger text.
- QA: run the two-account manual path and record screenshots or reproduction notes for any overlap, clipping, or incorrect route visibility.

## Next Active Story

### FS-002: Booking Status Feedback

Owner: Frontend / UX
Status: In progress

Status: Complete

Outcome: Confirm, Decline, booking submission, and failure states are visibly distinct, retryable, and bounded by timeouts without changing server rules.

### FS-003: Today Appointment Card Hierarchy

Owner: Frontend / UX
Status: Complete

Outcome: provider cards show customer identity, service, time, price, status explanation, and safe actions with wrapping for larger text. Migration `0012` is applied.

### FS-004: Booking-Linked Messaging UX

Owner: Frontend / Backend
Status: In progress

Status: Complete

Outcome: booking threads show participant and service context, empty threads are visible, and customer/barber send/read states are explicit. Full message history remains a separate backend gap.

## Next Active Story

### FS-009: Accessibility Audit

Owner: QA / UX
Status: In progress

Focus: verify the working customer/provider flow at larger text, VoiceOver, contrast, and web keyboard boundaries.

Progress: source-level fixes and the audit matrix are complete. Physical iPhone/Android and browser interaction checks remain the only blocker to closing this story.

## Next Ready Stories

- FS-011: Authorization And Concurrency Test Matrix

## Coordination Risks

- Do not use the demo role selector as authorization in Supabase mode.
- Do not hide an error by falling back to local data when a live request fails.
- Do not mark a booking confirmed in customer copy until the provider action returns `confirmed`.
- Keep the existing customer and barber accounts separate during testing.

## Sprint Exit Check

The sprint is ready to close when FS-001 through FS-004 have acceptance evidence, the quality commands pass, and the customer-to-provider manual workflow can be repeated without facilitator explanation.
