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
Status: In progress

First checks:

- Customer account sees Home, Explore, Bookings, Messages, Profile.
- Barber account sees Today and can still reach the account/settings path.
- Owner/admin navigation does not expose customer-only actions as provider actions.
- Settings shows the signed-in identity and role.
- Sign out works on native and web.
- No duplicate Explore/Find destination appears.

Handoff:

- Frontend: inspect `src/components/app-tabs.tsx`, `src/components/app-tabs.web.tsx`, `src/app/settings.tsx`, and `src/components/customer-tabs.ts`.
- UX: define the intended customer/provider tab hierarchy and states at narrow width and larger text.
- QA: run the two-account manual path and record screenshots or reproduction notes for any overlap, clipping, or incorrect route visibility.

## Next Ready Stories

- FS-002: Booking Status Feedback
- FS-003: Today Appointment Card Hierarchy
- FS-004: Booking-Linked Messaging UX
- FS-009: Accessibility Audit
- FS-011: Authorization And Concurrency Test Matrix

## Coordination Risks

- Do not use the demo role selector as authorization in Supabase mode.
- Do not hide an error by falling back to local data when a live request fails.
- Do not mark a booking confirmed in customer copy until the provider action returns `confirmed`.
- Keep the existing customer and barber accounts separate during testing.

## Sprint Exit Check

The sprint is ready to close when FS-001 through FS-004 have acceptance evidence, the quality commands pass, and the customer-to-provider manual workflow can be repeated without facilitator explanation.
