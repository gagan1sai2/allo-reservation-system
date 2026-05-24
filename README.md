# Allo Reservation System

Live URL: [https://allo-reservation-system-gagan.vercel.app](https://allo-reservation-system-gagan.vercel.app)

## Overview
A temporary inventory reservation system that prevents overselling under concurrent load.

## How concurrency is handled
The reservation API uses a PostgreSQL transaction with `SELECT ... FOR UPDATE` row locking.
When two requests arrive simultaneously for the same inventory:
- Both enter the transaction
- The first acquires the row lock; the second waits
- The first checks stock, decrements `reservedUnits`, commits
- The second reads the updated row — and gets a 409 if stock is now insufficient
This guarantees atomicity — no overselling is possible.

## Reservation lifecycle
PENDING → CONFIRMED (purchase succeeds, totalUnits decremented)
PENDING → RELEASED (user cancels or expiry cleanup fires)

## Idempotency Key (Bonus)
The reserve (`POST /api/reservations`) and confirm (`POST /api/reservations/:id/confirm`) endpoints support retry safety via the `Idempotency-Key` header.
- The server checks for the key in `IdempotencyRecord` table before executing side-effects.
- If the key exists, the saved JSON response and status code are returned instantly.
- Successful or business-failure outcomes are recorded atomically to prevent duplicate bookings or confirms, while raw connection issues (500) are retryable.

## Expiry
Reservations expire after 10 minutes. A Vercel Cron job runs daily to release expired PENDING reservations and restore stock.

## API Documentation
- `GET /api/products`: Lists products with total, reserved, and available stock levels per warehouse.
- `GET /api/warehouses`: Lists warehouses with aggregate stock totals.
- `POST /api/reservations`: Reserves a custom quantity of units (returns `409` if stock is insufficient).
- `POST /api/reservations/:id/confirm`: Commits a purchase (returns `410` if reservation has expired).
- `POST /api/reservations/:id/release`: Cancels checkout and immediately restores available stock.

## Local setup
```bash
npm install
cp .env.example .env   # fill in DATABASE_URL and DIRECT_URL
npx prisma migrate dev
npx prisma db seed
npm run dev
```

## Stack
Next.js App Router · TypeScript · Prisma · Supabase PostgreSQL · Tailwind · shadcn/ui · Vercel

## Tradeoffs
- Skipped Redis — PostgreSQL row locking is sufficient for this scale. Idempotency is managed atomically in the database layer.
- No optimistic UI — stock counts refresh after action, not speculatively.
- Cleanup is cron-based rather than event-driven; in production this would be a background worker.
