# Fade Society

> Mobile-first barber discovery and booking for customers, barbers, studio owners, and platform administrators.

Fade Society is a cross-platform product prototype built with Expo, React Native, TypeScript, and Expo Router. It demonstrates a complete customer booking journey while laying out the architecture for a multi-role marketplace.

This project demonstrates product thinking as well as implementation: typed domain models, booking state transitions, local double-booking protection, accessibility-aware UI, a Supabase schema, and a clear path from demo state to server-authoritative operations.

The project demonstrates a complete customer booking journey while laying out the architecture for a multi-role marketplace serving customers, barbers, studio owners, and platform administrators.

## Product Demo

The current demo supports:

- Browse barbers and studios
- View a barber profile
- Select a service
- Select an available time
- Review appointment details
- Submit a booking request
- View confirmation details
- Reschedule, cancel, and restore demo bookings
- View booking-linked conversations
- Configure appearance and accessibility preferences
- Preview customer, barber, owner, and admin roles in demo settings

The local demo intentionally does not process real payments or use a live booking backend yet.

## Technical Highlights

- Expo SDK 57 and React Native
- TypeScript domain models for users, studios, barbers, services, availability, bookings, and messages
- Expo Router navigation for iOS, Android, and web
- Shared typed application store with validated local state
- Booking status transitions and local double-booking protection
- Accessibility labels and selected/disabled states across the primary flow
- Vitest contract and domain tests
- ESLint and TypeScript quality gates
- Supabase/PostgreSQL schema and transactional booking RPC scaffold
- EAS development build configuration for iOS

## Why it exists

Independent barbers and studios need a focused way to present services, availability, and conversations without forcing customers through a generic scheduling flow. Fade Society explores that experience from discovery through confirmation, while keeping marketplace roles and operational concerns visible in the architecture.

## Architecture

The authoritative Expo Router tree is `src/app`.

```text
src/
  app/                 Screens and route modules
  components/          Shared navigation and UI components
  data/                Repository interfaces and backend contracts
  domain/              Typed models, catalog data, and date utilities
  state/               Local demo store and booking mutations
supabase/
  migrations/          PostgreSQL schema and booking RPC scaffold
  functions/           Edge Function contract scaffolding
tests/                 Domain and repository contract tests
docs/                  Production roadmap and phase notes
```

## Run Locally

Install dependencies:

```powershell
npm install
```

Start the web preview:

```powershell
npm run web
```

Start the iOS development client over LAN:

```powershell
npx expo start --dev-client --lan --clear --port 8081
```

The iOS development build must be installed on the registered device before using the development-client command. The app is not currently intended for Expo Go because the project uses a custom development build workflow.

## Quality Checks

```powershell
npm test -- --run
npm run lint
npx tsc --noEmit
npx expo export --platform ios --clear
```

## Demo Walkthrough

1. Open Home or Explore.
2. Select a barber.
3. Select a service and available time.
4. Review and submit the booking request.
5. Open Bookings to reschedule or cancel.
6. Open Messages to contact the studio or report a problem.
7. Open Settings for appearance, accessibility, and internal demo-role previews.

## Project Status

Fade Society is an internal demo and architecture foundation, not a public production marketplace.

The next production milestones are:

1. Connect the Supabase schema and authentication.
2. Replace local booking mutations with server-authoritative transactions.
3. Add barber and studio-owner operational dashboards.
4. Add payments, notifications, support operations, monitoring, and release automation.

See [docs/production-roadmap.md](docs/production-roadmap.md) for the full release plan.

## Portfolio context

Built by [Myles B. Scott](https://github.com/mscott9160-web) as an end-to-end product and mobile engineering project. The repository is intentionally transparent about what is implemented in the demo and what still needs production infrastructure, payments, monitoring, and real-device validation.

## License

See [LICENSE](LICENSE).
