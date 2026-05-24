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

## Expiry
Reservations expire after 10 minutes. A Vercel Cron job runs daily to release expired PENDING reservations and restore stock.

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
- Skipped Redis — PostgreSQL row locking is sufficient for this scale
- No optimistic UI — stock counts refresh after action, not speculatively
- Cleanup is cron-based rather than event-driven; in production this would be a background worker
