# Spec: Playoff bracket

**Status:** TODO. Blocked until the open questions in [ADR-0006](../adr/0006-computed-standings.md) are answered and `lib/standings.ts` exists.
**Effort:** medium (about 1 day, once computed standings exist)
**Depends on:** computed standings and placeholder references in `games` (ADR-0006)

## Problem

After the group stage, every team plays placement games. In 2025 these appeared in the schedule as ordinary games, and nobody could see how they connect: who plays whom if they win, and which game decides 1st place. Placement games were also only filled in by hand once the groups were done.

## Goal

A page that shows the placement round per class as a bracket. It fills in live as group and playoff results come in:

```
Halbfinale            Finale
┌──────────────┐
│ 1 Mannheim  7│──┐
│ 4 Nagold    3│  │   ┌──────────────┐
└──────────────┘  ├──▶│ Mannheim     │  🥇
┌──────────────┐  │   │ Darmstadt 1  │
│ 2 Darmst. 1 5│──┘   └──────────────┘
│ 3 Heidelb.  4│       Spiel um Platz 3
└──────────────┘       Nagold – Heidelberg

Platz 5/6   Herrenberg – Karlsruhe    6:2
Platz 7/8   Stuttgart 1 – Bretten 1   –:–  (16:30, Halle 2)
...
Platz 11–13 (Runde): Tabelle mit S/N/Diff
```

## Placement structure (from ADR-0006, inferred, to confirm)

| Seeds | Games | Shown as |
|-------|-------|----------|
| 1–4 | Semifinals 1 v 4, 2 v 3 → final + 3rd-place game | real bracket (two rounds) |
| 5–6, 7–8, 9–10 | one game per pair | list of single "Platz X/Y" games |
| last 3 | mini round robin | small table (wins, then difference) |

T-Ball 2025 (7 teams): semifinals + a round robin for places 5–7. The view must derive this structure **from the games and their placeholders**, not hard-code team counts.

## Data model needs (part of the ADR-0006 schema migration)

The bracket needs each placement game to say what it is and where its teams come from. Proposal, to be finalized in the migration:

- `games.stage`: `'group' | 'placement'` (plus a group letter for group games, `games.group`)
- `games.label`: e.g. `'Halbfinale 1'`, `'Finale'`, `'Spiel um Platz 3'`, `'Platz 5/6'`, `'Platzierungsrunde 11–13'`
- `games.home_ref` / `games.away_ref`: a placeholder until it's resolved, e.g. `seed:1`, `winner:63`, `loser:64`. `hometeam`/`awayteam` stay null until the ref resolves (or the resolved name is computed client-side only; decide in the migration).

The bracket is built purely from these fields: semifinal → final edges come from `winner:` refs, the 3rd-place game from `loser:` refs.

## Behaviour

- New route `/bracket` ("Finalrunde" in the nav), with one section per class like `/standings`. Alternatively, a tab on `/standings`; decide when building.
- **Before the group stage is finished:** show the structure with placeholders ("Platz 1 Gruppe A / Seed 1", "Sieger HF 1") plus time and hall, so people can already see when the final is.
- **Live:** seeds fill in as soon as the group stage of that class is complete (all group games have results). Winners move forward once a result is entered. Realtime comes for free via `useRealtimeTable('games')`.
- Each game box shows the seed number, team names, score (if played), otherwise time + hall. The winner is bold.
- Final placement 1…n is shown at the end, or on `/standings` as the overall ranking (same function).
- Seeding is provisional while groups are still running? **No.** Only show resolved seeds when the group is finished, otherwise teams would jump around and confuse people. Optionally show "vorläufig" in grey.
- Phone first: the two-round bracket fits at 375 px when stacked vertically (semifinals above, final below). Use the horizontal layout from `lg` up.

## Logic

Put it in pure, unit-tested functions next to the standings code:

- `resolveRef(ref, games, standings) → team | null`
- `buildBracket(games, class) → { rounds, placementGames, roundRobin, finalRanking }`
- Tests: replay the 2025 data (`supabase/seed.sql`) and check that the 2025 final ranking comes out.

## Out of scope

- Editing or generating the schedule from the bracket (the schedule is still entered in the dashboard).
- Fancy SVG connector lines. Simple CSS borders are enough.

## Open questions

All of ADR-0006's open questions, plus:

1. Does the 2026 placement structure stay the same (semifinals + pairs + mini round robin)?
2. Own page `/bracket` or a tab within `/standings`?
3. Should the resolved team name be written back to `hometeam`/`awayteam` (e.g. by the admin page), or only computed in the client?

## Tasks

- [ ] Answer the ADR-0006 questions; finalize `stage`/`label`/`*_ref` in the schema migration
- [ ] `lib/bracket.ts`: `resolveRef`, `buildBracket`, with tests against the 2025 data
- [ ] `Bracket` component (stacked on mobile, horizontal on `lg`)
- [ ] Placement list and mini round-robin table
- [ ] Nav entry, check light and dark mode on a phone
