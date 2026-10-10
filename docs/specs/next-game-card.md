# Spec: "Mein Team" card

**Status:** TODO
**Effort:** small (about 2–3 hours)
**Depends on:** nothing

## Problem

Most visitors (parents, players, coaches) only want to know one thing: *when and where does my team play next?* Today they have to pick their team in the filter and then scroll through the list to find the first upcoming game. Teams also miss their **scorer duty**, because it's only a small grey line under someone else's game.

## Goal

When a team is selected in the team filter, show a card above the game list that answers this at a glance:

```
┌───────────────────────────────────────────┐
│ Kangaroos A                               │
│ Nächstes Spiel: 10:30 Uhr · Halle 2       │
│ gegen Stuttgart 1            (in 12 Min.) │
│ ───────────────────────────────────────── │
│ 📋 Scorer-Dienst: 11:15 Uhr · Halle 1     │
└───────────────────────────────────────────┘
```

## Behaviour

**When the card is shown**
- Only when the team filter is set to a specific team (not "Alle"). The class and hall filters don't affect the card: it always looks at all of the team's games.
- The selection is already saved per device (`usePersistedState('selectedTeam')`), so returning visitors see the card immediately.

**"Nächstes Spiel"**
- The team's first game (`hometeam` or `awayteam` = team) whose `time` (HH:MM) is ≥ now and that has no result yet (`homescore == null`).
- Show time, hall, opponent and a relative hint: "in 12 Min." if it starts within 60 minutes, "läuft" if it started at most 30 minutes ago and has no result yet.
  - The 30-minute window is an assumption (2025 games were in 30-minute slots). Make it a constant.
- If a game has started but has no result, it's the "current" game. Show it with "läuft" instead of jumping to the next one.

**"Scorer-Dienst"**
- The team's next upcoming game where it is the `scorer`. Show it only if it's the team's next appointment overall, or if it starts within the next 60 minutes. That way the reminder is visible when it matters, but doesn't take over the card.
- ⚠️ In 2025 the scorer was sometimes a **club** ("Bretten") rather than a team ("Bretten 1", "Bretten 2"). Rule: a scorer entry matches the selected team if it's equal to the team name, **or** if the team name starts with the scorer name followed by a space (`"Bretten 1".startsWith("Bretten ")`). Cover this with a unit test.
  - The team filter currently also lists scorer-only names like "Bretten" as teams. Out of scope here, but note it for the cleanup.

**End and edge states**
- No more games and no more scorer duty: "Alle Spiele gespielt 🎉". Add the team's overall record (W–L) once computed standings ([ADR-0006](../adr/0006-computed-standings.md)) exist.
- Before the event day / before the first game: the "next game" is simply the first game. The schedule has no date (`time` only), so "now" always means today's clock time. That's acceptable because the app is only used on the day itself. Hide the relative "in X Min." if the game is more than 60 minutes away.
- Placeholder matchups (e.g. "Sieger Spiel 12", once ADR-0006 adds them) show the placeholder as the opponent. The team's own placement games only appear once the reference is resolved to its name.
- Events (`eventname` set, e.g. "Siegerehrung") are ignored.

**Live updates**
- The card recomputes from the same `games` array and `useNow()` the list already uses. No extra subscription. When a result is entered, the card moves on to the next game automatically.

## Design notes

- daisyUI `card` with a highlighted background (e.g. `bg-primary text-primary-content` or `bg-base-300`), placed between the filters and the divider.
- Tapping the card scrolls to that game in the list. Nice to have.
- German UI, as everywhere ([ADR-0003](../adr/0003-single-event-german-ui.md)).

## Out of scope

- Push notifications or reminders.
- Following several teams at once.
- Deep links (`/?team=…`) are a separate idea, but they would pair well with this card.

## Tasks

- [ ] Pure function `getTeamOutlook(games, team, now)` in `lib/teamOutlook.ts` → `{ current?, next?, scorerDuty?, done }`
- [ ] Unit tests: normal case, running game, scorer matched by club name, no more games, before the first game, events ignored
- [ ] `NextGameCard` component, rendered in `GamesTable` when `selectedTeam !== 'all'`
- [ ] Check on phone width (light mode only, see the [design](../design/README.md))
- [ ] Optional: tap → scroll to the game
