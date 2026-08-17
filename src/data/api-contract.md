# Fade Society API Contract Draft

This is a draft contract for Phase 3. It is not a live backend.

## Identity

- `GET /v1/me`
- `POST /v1/auth/sign-out`
- `DELETE /v1/me`

The server owns user identity, role, and studio membership. Client role toggles are demo-only and must not become authorization.

## Catalog

- `GET /v1/studios`
- `GET /v1/studios/:studioId/barbers`
- `GET /v1/barbers/:barberId/services`
- `GET /v1/barbers/:barberId/availability?from=&to=`

Availability responses use UTC ISO timestamps plus the provider timezone. Prices and service duration come from the server catalog.

## Bookings

- `GET /v1/bookings`
- `POST /v1/bookings`
- `PATCH /v1/bookings/:bookingId/reschedule`
- `POST /v1/bookings/:bookingId/cancel`

Booking creation requires an `Idempotency-Key` header. The server atomically validates the slot, service, price, ownership, and cancellation rules. A client never chooses the final status or price.

Suggested status values: `pending`, `confirmed`, `declined`, `failed`, `cancelled`, `completed`, `no_show`.

## Messages

- `GET /v1/conversations`
- `GET /v1/conversations/:participantId/messages`
- `POST /v1/conversations/:participantId/messages`
- `POST /v1/conversations/:participantId/read`

Messages must be authorized by booking/studio relationship and support moderation/reporting metadata.

## Authorization Rules

- Customers can access only their own bookings and conversations.
- Barbers can access bookings assigned to them and their own availability.
- Owners can access studios they administer and their team schedules.
- Admins can access platform operations through explicit server permissions and audit logs.
- Every mutation validates the authenticated actor on the server.
