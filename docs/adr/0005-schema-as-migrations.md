# ADR-0005: Database schema lives in the repo as migrations

**Status:** Accepted
**Date:** 2026-10-10
**Deciders:** Martin Wittemann

## Context

In the first version, the tables (`games`, `standings`, `items`, `faq`), three enum types (`class`, `location`, `team`), the RLS policies and the Realtime setup were all created by hand in the Supabase dashboard and never written down. The only copy was the live project, which pauses when idle. If that project is lost, so is the knowledge of how to rebuild it.

## Decision

- All schema, RLS policies and Realtime publication settings are defined as SQL migrations in `supabase/migrations/` (Supabase CLI format, `YYYYMMDDHHMMSS_name.sql`).
- The first migration, `20251120000000_initial_schema.sql`, is an exact export of the live schema as of 2026-10-10. It is not edited afterwards.
- `supabase/seed.sql` holds the 2025 tournament data for local development, and as the reference case for computed standings ([ADR-0006](0006-computed-standings.md)).
- Schema changes go through a new migration, never through the dashboard alone.

## Options Considered

### Option A: Supabase CLI migrations (chosen)

**Pros:** Versioned with the code, reviewable, and can rebuild the database from scratch in one step. Works with `supabase db reset` locally and the Supabase MCP / `supabase db push` remotely.
**Cons:** Small learning curve. Changes made in the dashboard can drift from the repo if this discipline isn't followed.

### Option B: Keep editing in the dashboard, export occasionally

**Pros:** No tooling.
**Cons:** The schema only exists in a project that pauses when idle. There's no review and no history.

## Consequences

- The live project's migration history is still empty, because the baseline was created by hand there. Before the first new migration is applied remotely, mark the baseline as applied (`supabase migration repair --status applied 20251120000000`) so it isn't run a second time.
- Before each event: restore the project, apply pending migrations, load that year's games and items.
- Generate TypeScript types from the schema (`supabase gen types`) instead of writing them by hand in `app/types.ts`.
- Each year's live tournament data is exported at the end of the event (as was done for 2025 into `seed.sql`).
