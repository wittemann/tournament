# ADR-0002: Next.js, Supabase, Tailwind and daisyUI

**Status:** Accepted
**Date:** 2026-10-10 (recorded after the fact; chosen November 2025)
**Deciders:** Martin Wittemann

## Context

The app is used on one day a year by parents, players and helpers, almost all on phones in a sports hall. It must show schedule changes and results live, cost nothing to host, and be maintainable by one person in their spare time.

## Decision

- **Next.js (App Router) + React + TypeScript**, hosted on Vercel.
- **Supabase** (Postgres + Realtime) as the database and live-update channel.
- **Tailwind CSS v4 + daisyUI** for styling.

## Options Considered

### Option A: Next.js + Supabase (chosen)

**Pros:** Both have free tiers that easily cover one event day. Supabase's table editor works as a basic admin interface without building one. Realtime updates need no server code. Familiar to the maintainer.
**Cons:** Free Supabase projects pause when idle and must be restored before each event. A restore takes several minutes, and the database can look empty before it has fully finished. Next.js is more framework than a mostly client-side app strictly needs.

### Option B: Static site + spreadsheet (e.g. Google Sheets as data source)

**Pros:** Very easy to edit data.
**Cons:** No real live updates, API rate limits, and computing standings in a spreadsheet brings back manual work.

### Option C: Own backend (e.g. Node + SQLite on a VPS)

**Pros:** Full control, nothing pauses.
**Cons:** Hosting cost, server maintenance and building realtime by hand, all for a single day a year.

## Consequences

- Before each event, restore the Supabase project and apply migrations ([ADR-0005](0005-schema-as-migrations.md)).
- Tailwind v4 is configured in `app/globals.css`. There is no `tailwind.config.js`.
- Dependencies (especially Next.js and React) need a security update pass before each event. One React Server Components security fix was already needed in January 2026.
