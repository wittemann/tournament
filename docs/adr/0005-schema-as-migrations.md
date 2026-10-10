# ADR-0005: Database schema lives in the repo as migrations

**Status:** Accepted
**Date:** 2026-10-10
**Deciders:** Martin Wittemann

## Context

In the first version, the tables (`games`, `standings`, `items`, `faq`) were created by hand in the Supabase dashboard and never written down. When the paused project was restored on 2026-10-10, the database was empty: no tables, policies or data. The schema had to be reconstructed from the app code.

## Decision

- All schema, RLS policies and Realtime publication settings are defined as SQL migrations in `supabase/migrations/` (Supabase CLI format, `YYYYMMDDHHMMSS_name.sql`).
- Example data for development lives in `supabase/seed.sql`.
- Schema changes go through a new migration, never through the dashboard alone.

## Options Considered

### Option A: Supabase CLI migrations (chosen)

**Pros:** Versioned with the code, reviewable, and can rebuild the database from scratch in one step. Works with `supabase db reset` locally and the Supabase MCP / `supabase db push` remotely.
**Cons:** Small learning curve. Changes made in the dashboard can drift from the repo if this discipline isn't followed.

### Option B: Keep editing in the dashboard, export occasionally

**Pros:** No tooling.
**Cons:** Exactly what led to losing the schema.

## Consequences

- Before each event: restore the project, apply migrations, load that year's games and items.
- Generate TypeScript types from the schema (`supabase gen types`) instead of writing them by hand in `app/types.ts`.
- Tournament data itself (games, items) is not in git. Keep an export of each year's data outside Supabase as a backup.
