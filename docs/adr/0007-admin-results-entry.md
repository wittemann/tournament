# ADR-0007: Results entry through an admin page

**Status:** Proposed
**Date:** 2026-10-10
**Deciders:** Martin Wittemann

## Context

In 2025, results and sold-out flags were entered directly in the Supabase table editor. That worked, but it's clumsy on a phone, and every helper who enters results needs full dashboard access to the whole project. With computed standings ([ADR-0006](0006-computed-standings.md)), entering a score is the only manual step left on tournament day.

This is wanted if it's easy to build, but it isn't a must-have.

## Decision (proposed)

Add an `/admin` page, protected by **Supabase Auth** (email login for a small number of known users, no public sign-up):

- A list of games with two score inputs per game and a save button.
- Sold-out toggles for the sales items.
- RLS lets only authenticated users update `games.homescore`/`awayscore` and `items.soldOut`. Everything else stays read-only for them too, and schedule changes still go through the dashboard.

## Options Considered

### Option A: Admin page with Supabase Auth (proposed)

**Pros:** Fast on a phone. Helpers only get the access they need. Uses the same live data and standings code as the public pages.
**Cons:** Login flow, RLS write policies and a form need building and testing (roughly half a day).

### Option B: Keep using the Supabase table editor

**Pros:** Zero work, and it already worked.
**Cons:** Clumsy on a phone. Every helper needs full dashboard access to the project.

### Option C: Shared secret PIN instead of real logins

**Pros:** Quick for helpers.
**Cons:** Needs a server-side check (an API route or Edge Function with the service key). Weaker security, and no record of who entered what.

## Consequences (if accepted)

- New RLS policies for `authenticated` in a migration ([ADR-0005](0005-schema-as-migrations.md)).
- Admin users are invited from the Supabase dashboard before the event.
- Option B always remains available as a fallback.

## Open Questions

- Do we build it for 2026, or keep using the table editor?
- Who needs access besides the maintainer?
