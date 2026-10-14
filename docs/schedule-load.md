# Loading the schedule

How to get the teams, groups, halls and schedule of an edition into the live Supabase project. You fill one JSON file; a checker enforces the rules from [TODO §9](TODO.md); a script turns the checked file into one SQL script that you apply via the Supabase MCP. The script never talks to the database and needs no credentials.

## 1. Fill the file

Start from a copy of [schedule-example-2025.json](schedule-example-2025.json) (the 2025 edition in this format, without scores; it differs from the real 2025 data in one scorer: Schüler "Bretten 2" kept score at 14:00 while playing in another hall, which the checker rejects, so that scorer is left out). Keep your copy outside the repo or in a git-ignored place if you don't want it committed.

```json
{
  "halls": ["Halle 1", "Halle 2", "Foyer"],
  "teams": {
    "T-Ball": { "A": ["Nagold", "Bretten"], "B": ["Karlsruhe", "Remchingen"] }
  },
  "games": [
    { "class": "T-Ball", "time": "09:00", "hall": "Halle 1", "home": "Nagold", "away": "Bretten", "scorer": "Karlsruhe" },
    { "class": "T-Ball", "time": "12:00", "hall": "Halle 1", "label": "Halbfinale 1", "home": "seed:1", "away": "seed:4" },
    { "class": "T-Ball", "time": "12:30", "hall": "Halle 1", "label": "Finale", "home": "winner:Halbfinale 1", "away": "winner:Halbfinale 2" },
    { "class": "T-Ball", "time": "13:30", "hall": "Foyer", "event": "Siegerehrung" }
  ]
}
```

- **halls**: in display order (the position becomes the hall's sort order). Include the event room, last.
- **teams**: class, then group letter (one capital letter), then team names. A team is name + class; the same name can be in two classes. Classes: `T-Ball`, `Schüler`, `Jugend` (anything else needs a migration first).
- **games**: one object per row, in any order. The kind follows from the fields:
  - **group game**: `class`, `time` (`HH:MM`), `hall`, `home`, `away` (team names of that class and one group).
  - **placement game**: like a group game but with a `label` ("Halbfinale 1", "Platz 5/6"), and `home`/`away` are refs instead of teams:
    - `seed:<n>`: seed n of the class across all groups.
    - `group:<G>:<n>`: place n of group G.
    - `winner:<label>` / `loser:<label>`: winner or loser of the placement game with that label (same class, played earlier). You never write game numbers; the script assigns them (by time, then hall order, then file order, across all classes) and rewrites these refs to `winner:<number>`.
    - Use one style per class, `seed:` or `group:`, not both.
  - **event**: `class`, `time`, `hall`, `event` ("Siegerehrung", "Mittagspause"). The class is needed because the class filter would hide the event otherwise. Name the room `Foyer`, no emoji.
  - **scorer** (optional, on any game): the team keeping score. `scorerClass` is only needed when that team is in another class.
- Scores are not part of the file; they are entered live.

## 2. Check and convert

```sh
npm run schedule:sql -- path/to/schedule.json [out.sql]
```

The output file defaults to the input name with `.sql`. Every finding names the game by its position in the `games` array ("game 3" is the third object, counting from 1) and its details. Exit code 1 means errors; no SQL is written then.

**Errors** (fix them): unknown hall, class or team; a team not in the game's class; group games between teams of different groups; a hall or team booked twice at the same start time (a team playing and keeping score at once, or scoring its own game, counts; events don't clash with each other); refs that don't parse or don't resolve; `winner:`/`loser:` pointing at a game that isn't played earlier; a label that is referenced but used by several games; `seed:` and `group:` mixed in a class; a `seed:`/`group:` beyond the number of teams or group size; a final fed by two semifinals but no 3rd-place game between their losers; unknown fields and malformed times.

**Warnings** (read them, usually fix): event room not `Foyer`; emoji in an event name; placement label longer than 16 characters; several placement games with the same label that nothing references and that aren't a round robin; a team without any group game; a team keeping score for two games at the same start time (maybe a club covering two halls).

What the checker can't know: slot overlap between different start times (a 12:15 game in a hall with a 12:00 game), and who plays a placement game before the group stage is done.

## 3. Back up, apply, check

1. Back up what is live: the 2025 data is already in `supabase/seed.sql`; for anything newer, export the `halls`, `teams` and `games` tables first (Supabase MCP `execute_sql`, `select json_agg(t) from public.games t`, same for the other two; save the output).
2. Load before the doors open: the load wipes all scores and fires one realtime event per row, so open pages flicker and refetch. Apply the SQL file via the Supabase MCP (`execute_sql` with the file's contents; it is one transaction, so a failure changes nothing). It replaces `games`, `teams` and `halls`; `items` and `faq` are untouched. A row-count check at the end aborts the transaction if something is off.
3. Set `RUNNING_WINDOW_MINUTES` in `lib/gameStatus.ts` to the slot length ([TODO §9](TODO.md)).
4. Smoke test: Spielplan, Tabelle and Finalrunde at phone width for every class; the placeholders ("Sieger Halbfinale 1", "1. Gruppe A") should read well and the bracket should draw.
