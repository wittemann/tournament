# ADR-0001: Evolve the existing codebase instead of rewriting

**Status:** Accepted
**Date:** 2026-10-10
**Deciders:** Martin Wittemann

## Context

The first version was built in November 2025 for one tournament weekend. For the 2026 edition it needs new features, mainly computed standings ([ADR-0006](0006-computed-standings.md)) and possibly an admin page ([ADR-0007](0007-admin-results-entry.md)). A full rewrite from scratch was considered.

The existing app is small, about 700 lines across four pages. Its problems were repeated data-loading code, a few display bugs and a schema that only existed in the Supabase dashboard ([ADR-0005](0005-schema-as-migrations.md)), not its architecture or stack.

## Decision

Keep the repository and stack. Clean up the existing code first, then add features on top. The data model is redesigned where the new features need it (standings, possibly game references for playoffs) without rewriting the UI.

## Options Considered

### Option A: Evolve the existing app (chosen)

**Pros:** The schedule, filters, mobile cards, sales menu and FAQ already work and were used on a real tournament day. The cleanup took about an hour. Git history is kept.
**Cons:** Some leftovers of the old design may stay longer than they would in a clean slate.

### Option B: Rewrite from scratch

**Pros:** A clean start, and a chance to pick a different stack.
**Cons:** Rebuilds working UI for no user-visible gain. The new features don't need a different architecture. Higher risk of regressions before a fixed event date.

## Consequences

- The cleanup landed first (commit `60858ea`): one Supabase client, a shared `useRealtimeTable` hook, a server-side layout, and bug fixes.
- New features are built against the cleaned-up structure in `lib/` and `app/`.
- If a feature later turns out to need a different architecture, write a new ADR rather than bending this one.
