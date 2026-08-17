# Phase 1: Foundation and Demo Safety

Status: Complete

## Goal

Make the current demo coherent, repeatable, and safe to extend without implying that local state is a live marketplace booking.

## Checklist

- [x] Route ownership consolidated around `src/app`.
- [x] Typed domain models added.
- [x] Stable IDs and structured booking timestamps added.
- [x] Booking mutations moved behind typed store functions.
- [x] Validated hydration and persistence fallback added.
- [x] ESLint and focused store tests added.
- [x] Primary booking controls have accessibility metadata.
- [x] Add demo-mode labels for local catalog and availability.
- [x] Add reset-demo-data action.
- [x] Document exact quality commands and manual demo path.

## Quality Commands

```powershell
npm test -- --run
npm run lint
npx tsc --noEmit
npx expo export --platform ios --clear
```

## Manual Demo Path

1. Open Home.
2. Open Find.
3. Search or filter for a studio.
4. Open a barber profile.
5. Select a service.
6. Select a date and time.
7. Review and confirm.
8. Verify the booking in Bookings.
9. Reschedule, cancel, and restore the booking.
10. Open Calendar and verify the selected day.
11. Switch to the clearly labeled demo role in Profile.

## Exit Criteria

- [x] All quality commands pass.
- [x] Demo data is explicitly identifiable as local demo data.
- [x] A reset action restores the known seed state.
- [x] README and roadmap explain that backend, authentication, payments, notifications, and real availability are not yet present.
