# ADR-0003: One event per deployment, German-only UI

**Status:** Accepted
**Date:** 2026-10-10
**Deciders:** Martin Wittemann

## Context

The app serves one tournament, the Bretten Kangaroos Xmas-Ball, which takes place once a year. Supporting several tournaments or leagues would mean an `events` table, scoping every query, and event selection or routing in the UI.

All visitors are local families and club members.

## Decision

- One deployment serves exactly one event. Each year's edition reuses the same database after old data has been cleared or archived.
- Event-specific values (name, logo, age classes such as `Schüler` and `T-Ball`) may stay in code or simple config. They don't need a database model.
- The UI is German only. No i18n framework.

## Options Considered

### Option A: Single event (chosen)

**Pros:** Simplest schema and queries, nothing to select or route.
**Cons:** Past editions aren't kept online. Hosting a second tournament would need a second deployment or a later redesign.

### Option B: Multi-event model

**Pros:** History and reuse for other tournaments.
**Cons:** Extra complexity in every query and screen, for a need nobody has.

## Consequences

- Before each edition: clear (or export) last year's games, results and sales items.
- If the club wants an archive of past results, an export (CSV or a static page) is enough. Revisit this ADR only if a second tournament actually needs the app.
