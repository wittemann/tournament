# ADR-0004: Public client-side reads with Supabase Realtime

**Status:** Accepted
**Date:** 2026-10-10 (recorded after the fact; chosen November 2025)
**Deciders:** Martin Wittemann

## Context

Results and schedule changes must reach visitors' phones within seconds, without them reloading the page. All displayed data is public. Data volume is tiny: about 100 games, a few dozen sales items and FAQ entries.

## Decision

- Pages load data in the browser with the public Supabase key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- Each page subscribes to Postgres changes on its table and **reloads the whole table** on any change. This logic lives once in `lib/useRealtimeTable.ts`.
- Row Level Security (RLS) allows the public role to **read only**. Any write needs an authenticated user ([ADR-0007](0007-admin-results-entry.md)) or the Supabase dashboard.

## Options Considered

### Option A: Client-side fetch + reload on change (chosen)

**Pros:** Simple, no server code, always consistent. Reloading a table of about 100 rows costs nothing.
**Cons:** The first render is empty until data arrives. Every connected phone reloads on every change, which is fine at this scale.

### Option B: Apply change payloads to local state

**Pros:** Less traffic per update.
**Cons:** Handling insert/update/delete and ordering correctly adds code and bug surface, for no noticeable gain.

### Option C: Server rendering + polling

**Pros:** Content in the first HTML response.
**Cons:** Not live. Needs a revalidation strategy, and is still client-driven for updates.

## Consequences

- RLS policies are required for every table and live in the migrations ([ADR-0005](0005-schema-as-migrations.md)). The public key must never be able to write.
- Each table that pages subscribe to must be part of the `supabase_realtime` publication.
- Computed data (standings, [ADR-0006](0006-computed-standings.md)) should be derived from tables the client already subscribes to, so it updates live without extra plumbing.
