# ADR-0006: Standings are computed from game results

**Status:** Accepted
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

- `app/standings` reads `games` instead of `standings`. The `standings` table is dropped in a later migration (its 2025 contents stay in `supabase/seed.sql` as test reference).
- The `games` schema needs a group field and a way to reference placeholders like "winner of game 12" or "A1". This is defined in the schema migration.
- Correcting a wrong score fixes the standings and later matchups automatically.

## What the 2025 data shows

These rules were inferred by recomputing the 2025 games (`supabase/seed.sql`) and comparing them with the hand-entered standings. They match in both classes. The rules below were confirmed on 2026-10-10.

**Format.** Groups play a round robin (Schüler: A with 5 teams, B and C with 4; T-Ball: A with 4, B with 3). Then every team plays placement games, and the overall ranking comes from those games, not from the group tables.

**Group ranking.** Wins, then run difference (runs for minus runs against). With games 41 and 62 counted as placement games, all hand-entered group tables match the results. The exceptions are two typos: B1 Herrenberg was entered as +14, the results give +15; A1 Mannheim was entered as +71, the results give +70 (found by the replay tests, 2026-10-11). Every tie in 2025 was decided by run difference. Head-to-head was never needed (the only three-way tie, Schüler group B, was circular).

**Seeding.** Rank all teams across groups by group place, then win rate, then run difference, giving seeds 1…n. Win rate is used because the groups had different sizes; plain wins would have given the same order in 2025. Then:

| Seeds | Games | Decides |
|-------|-------|---------|
| 1–4 | Semifinals 1 v 4 and 2 v 3, then a final and a 3rd-place game | places 1–4 |
| 5–6, 7–8, 9–10 | One game per pair | places 5–10 (winner gets the better place) |
| last 3 | Mini round robin | the last 3 places (by wins, then run difference) |

Schüler (13 teams) used all of these. T-Ball (7 teams) used the semifinals plus a round robin for places 5–7. For example, the Schüler semifinal Mannheim (seed 1) v Nagold (seed 4) was a rematch from group A, which is consistent with seeding across groups rather than a fixed A1–B2 crossover.

**Other findings.**
- No game ended tied.
- Overall wins, losses and difference counted all games (group and placement), though T-Ball didn't track the overall difference.
- `scorer` is the team (or club) assigned to keep score for that game. It is not part of the result.

## Ranking rules (confirmed 2026-10-10)

**Group table**, per group. Only group games count.

1. **Win rate:** wins ÷ games played, where a tie counts as half a win. Win rate rather than plain wins, so that a team with an unplayed game isn't ranked lower while the group is still running.
2. **Run difference:** runs for minus runs against.
3. **Head-to-head:** the record in the games among the teams that are still level. This also covers three-way ties.
4. **Runs scored** in group games, if still level (e.g. they tied each other, or beat each other in a circle).

The table shows wins, losses, ties and run difference.

**Seeding for placement games.** Rank all teams of a class across groups by group place, then win rate, then run difference. This gives Seed 1…n.

**Placement games** are written into the schedule with placeholders instead of team names, e.g. `Seed 1` vs `Seed 4`, or `Sieger #41` vs `Verlierer #42`. The app resolves them as soon as the referenced groups or games are finished. The resolved teams are computed in the client only and never written back to the database (decided 2026-10-11). The structure (semifinals, pairs, round robin) is therefore decided per edition when writing the schedule, and the app doesn't need to know the number of teams.

**Ties.** Group games can end tied. Placement games always have a winner, so the admin entry / validation rejects equal scores there.

**Overall ranking** comes from the placement games: the winner of each final or pair takes the better place. A mini round robin (e.g. the last three) is ranked with the same rules as a group table.

## Edge cases (as built in `lib/standings.ts`, accepted 2026-10-12)

- A team that hasn't played yet sorts last in its group.
- **Head-to-head** compares win rate only in the games among the teams still level. If that splits them only partly, it is applied again to each smaller level subset. It is skipped unless every pair in the level set has played each other; runs scored decide then.
- A tie left after runs scored is ordered by name and flagged (`tiedWithNext`). The organizers settle it; the UI can warn. Placeholders still resolve through such a tie, so the bracket never stalls.
- **Seed ties** (same group place, win rate and difference) go by group letter.
- `group:G:n` resolves as soon as that group is complete; `seed:n` waits until every group with games is complete.
- Places that no game decides (e.g. no 3rd-place game) are left out of the overall ranking.
