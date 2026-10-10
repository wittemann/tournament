# ADR-0006: Standings are computed from game results

**Status:** Accepted (the direction). The ranking rules are still open, see below.
**Date:** 2026-10-10
**Deciders:** Martin Wittemann

## Context

In 2025, standings were a separate `standings` table typed in by hand during the event. Group membership was encoded in the position (`A1`, `B2` → group; `1`, `2` → overall). This was the most time-consuming manual work on tournament day, and error-prone under time pressure. It is the must-have feature for 2026.

## Decision

Remove the hand-maintained `standings` table. Standings are calculated from game results by a **pure TypeScript function** (`lib/standings.ts`) that runs in the browser on the `games` data the page already subscribes to ([ADR-0004](0004-client-side-realtime-reads.md)). The function is covered by unit tests built from real tournament scenarios, including ties.

Playoff and placement games may reference group results instead of team names (e.g. "A1 vs B2"). The same code resolves those references, so matchups fill in automatically once a group is finished.

## Options Considered

### Option A: Pure TS function in the client (chosen)

**Pros:** Tie-breakers such as head-to-head are easy to write and test in TypeScript. Updates live automatically, because it recomputes whenever `games` changes. No database logic to deploy or debug.
**Cons:** Every phone does the calculation, which is trivial at about 100 games. The admin view and the public view must use the same function (they do, since it's shared code).

### Option B: Postgres view / SQL function

**Pros:** One source of truth in the database. Usable from the Supabase dashboard.
**Cons:** Multi-step tie-breakers in SQL are hard to read and test. Views aren't part of Realtime, so clients would need extra wiring to update.

### Option C: Trigger that maintains a `standings` table

**Pros:** Precomputed and simple to read.
**Cons:** Most complex to get right (corrections, deleted results). Stored and derived data can drift.

## Consequences

- `app/standings` reads `games` instead of `standings`. The `standings` table is not recreated.
- The `games` schema needs a group field and a way to reference placeholders like "winner of game 12" or "A1". This is defined in the schema migration.
- Correcting a wrong score fixes the standings and later matchups automatically.

## Open Questions

These must be answered before `lib/standings.ts` is written:

1. **Format:** group stage and then playoffs or placement games? How is the overall ranking decided: by placement games or by combining the groups?
2. **Ranking order within a group:** wins, then run difference? Which tie-breakers follow (head-to-head, runs scored, coin toss)?
3. **Seeding:** which references do playoff games use (group positions like `A1`, winners or losers of earlier games)?
4. **Ties and unfinished games:** can a game end in a tie? How is a group with unplayed games shown?
