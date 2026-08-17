# Fade Society

Fade Society is a mobile-first barber discovery and booking experience built with Expo, React Native, TypeScript, and Expo Router.

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

To opt into the future Supabase adapter, copy `.env.example` to `.env.local` and fill in the public project values. Without `EXPO_PUBLIC_DATA_MODE=supabase`, the app stays in local demo mode.

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

### Progress Tracker

**Overall status:** Active development | Internal demo

| Area | Status | Progress |
| --- | --- | --- |
| Customer booking journey | In progress | Core discovery, booking, confirmation, messaging, cancellation, and recovery flows are demonstrated. |
| Demo safety and accessibility | In progress | Local demo labeling, resettable seed data, persistence recovery, and primary-flow accessibility are in place. VoiceOver, TalkBack, Dynamic Type, and contrast audit remain. |
| Backend and authentication | In progress | Supabase schema, authorization scaffolding, repository contracts, and booking RPC scaffolding are available. Live adapters, authentication, and server enforcement remain. |
| Provider and manager operations | Planned | Barber Today, availability management, studio overview, team, utilization, cancellations, and reports remain. |
| Payments and marketplace operations | Planned | Payments, refunds, payouts, disputes, reconciliation, and financial audit tools remain. |
| Production release | Planned | Monitoring, protected CI/CD, security scanning, store readiness, closed beta, and rollout gates remain. |

**What stakeholders can review now:** the customer booking experience, the architecture direction, the documented release gates, and the known limitations of the local demo.

**What is not represented as complete:** live bookings, real users, production authorization, payments, provider operations, analytics, or public marketplace readiness.

For detailed milestones and exit criteria, see [docs/production-roadmap.md](docs/production-roadmap.md).

The next production milestones are:

1. Connect the Supabase schema and authentication.
2. Replace local booking mutations with server-authoritative transactions.
3. Add barber and studio-owner operational dashboards.
4. Add payments, notifications, support operations, monitoring, and release automation.

See [docs/production-roadmap.md](docs/production-roadmap.md) for the full release plan.

## License

See [LICENSE](LICENSE).
