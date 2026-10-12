# Design: Xmas-Ball 2026

Phone-first redesign of all pages, made as a Claude Design canvas and agreed on 2026-10-10.

**Canvas:** [Xmas-Ball Redesign](https://claude.ai/artifact/3ZTm2LnM5YqZoj5B5ydYt2) (private, share it from its Share menu). This is the source of truth. If the design changes there, update this file and the copies in [`screens/`](screens/).

[`screens/`](screens/) holds a copy of each screen's source (`.dc.html`) and the canvas layout (`canvas.json`). They only render inside Claude Design (they need its runtime, and images point to the canvas's `/_blob/…` uploads), so treat them as a reference for markup and exact values, not as pages to open.

All data in the mockups is illustrative (2025 team names, invented scores and times). Items, prices and FAQ texts are the real 2025 data.

## Screens

| Screen | File | Notes |
|--------|------|-------|
| Spielplan, team selected | `Main.dc.html` | "Mein Team" card ([spec](../specs/next-game-card.md)), the team's games incl. scorer duties, "Jetzt" line |
| Spielplan, all teams | `SpielplanAlle.dc.html` | Games grouped by time slot, running games marked "läuft" |
| Tabelle | `Tabelle.dc.html` | One card per group, own team highlighted, cut-off line for the semifinals |
| Finalrunde | `Finalrunde.dc.html` | Semifinals → final, 3rd-place game, placement games ([spec](../specs/playoff-bracket.md)) |
| Finalrunde with quarterfinals | `FinalrundeVF.dc.html` | Variant for 8 teams; works up to 8, more would need one tab per round |
| Verkauf | `Verkauf.dc.html` | One card per category, sold-out items at the bottom |
| Info | `Info.dc.html` | Quick facts and PDF links on top, FAQ as an accordion |
| "Mein Team" card states | `MeinTeamZustaende.dc.html` | Below the Spielplan on the canvas: game running, scorer duty first, before the first game, all games played (with "Platz" or "Gr.-Platz"), group stage over with opponents still open |
| Loading, empty and edge states | `Zustaende.dc.html` | Next to the card states: loading, empty, "Keine Verbindung", "Turnier beendet", Tabelle before the first result, Finalrunde before the start, Endstand decided, class without a Finalrunde |

## Look

- **Fonts:** Barlow (400/500/600/700) for text, Barlow Condensed (600/700) for times, scores, titles and section headings (uppercase). Both from Google Fonts.
- **Shapes:** rounded cards on a light green-grey background, no borders. Radius 20 px for the header, 16 px for cards, 14 px for game cards, 12 px for inputs and switches, pills (999 px) for tabs and badges.
- **Touch targets:** at least 40 px high, main controls 48 px.

### Colours

| Token | Value | Use |
|-------|-------|-----|
| `green` | `#1B5E34` | Brand: header, "Mein Team" card, positive differences, next game outline |
| `ink` | `#142019` | Text, active tab, event cards (Siegerehrung), final |
| `muted` | `#56645A` | Secondary text, labels, played games |
| `muted-2` | `#3E4B42` | Inactive tabs and switch options |
| `faint` | `#818D84` | Borders and connector lines only (3:1 on ground); never text |
| `ground` | `#EEF2EC` | Page background |
| `surface` | `#FFFFFF` | Cards |
| `track` | `#DCE3DA` | Background of segmented switches |
| `line` | `#E6ECE5` | Dividers inside cards |
| `live` | `#B3261E` | "Jetzt" line and running games ("läuft"); used for nothing else |
| `negative` | `#A12A21` | Negative difference |
| `scorer-bg` / `scorer-ink` / `scorer-line` | `#FFF1D6` / `#5C3800` / `#D9A441` | Scorer duty, own team highlight ("Mein Team" tag `#FFDFA3`) |
| `win-bg` / `win-ink` | `#DDEFE2` / `#1B5E34` | "S" badge (not built yet), class tag Schüler |
| `loss-bg` / `loss-ink` | `#F6DEDC` / `#8E1F18` | "N" badge (not built yet), "Ausverkauft" tag |
| class T-Ball | `#FCE3CF` / `#7A3300` | Class tag |
| class Jugend | `#DCE6F7` / `#1E4A8C` | Class tag |
| `gold` | `#E8B84A` | Trophy icon on the final |

Class colours differ in lightness as well as hue, so they stay distinguishable for colour-blind visitors.

## Components

- **Header:** rounded green card with the kangaroo ([`public/kangaroo.png`](../../public/kangaroo.png), cut from the logo without the lettering), "XMAS-BALL", "Bretten Kangaroos" and the current time as a pill. The cut-out is only 90 px wide; ask the club for a larger original or an SVG.
- **Main navigation:** five pill tabs below the header, each as wide as its text with the leftover space shared equally. The current page is a dark pill. No horizontal scrolling.
- **Segmented switch** (grey track, white selected option): used for every filter: class and hall on the Spielplan (with a small uppercase label in front so both rows line up), class on Tabelle and Finalrunde. Hall options are short ("Alle · 1 · 2 · 3 · 4 · 5") so five or more halls fit. Not used for jump links.
- **Team select:** native `<select>`, 48 px, labelled "Mein Team". It is the main control on the Spielplan.
- **Game card:** time and hall in a fixed left column, the two teams with scores on the right, winner bold. Unplayed games show "–". Played games are muted. The next game of the selected team has a green outline, running games a red one.
- **Scorer duty:** dashed amber card in the team's game list, amber strip at the bottom of the "Mein Team" card.
- **Event card** (Siegerehrung, Mittagspause): dark card, title in condensed uppercase.
- **Bracket:** two columns (one per half), semifinals joined to the final by simple CSS borders. With quarterfinals, each column groups its two quarterfinals in a grey box above its semifinal. Seeds shown as "A1", "B4" etc.

## Decisions made in the design

- "Finalrunde" gets its own tab (answers open question 2 of the [bracket spec](../specs/playoff-bracket.md)).
- Light mode only: no dark mode for 2026 (one bright hall, one day; `color-scheme: light`).
- No desktop layout: the phone column is centred at about 480 px on larger screens.
- The `#id` game number is no longer shown (see `games.number` in the [TODO](../TODO.md)).
- Verkauf has no category jump buttons: three short sections are quicker to scroll.
- No mini round robin for the last places in the Finalrunde: the organizers would rather not play one again ([bracket spec](../specs/playoff-bracket.md), open question 1).
- "Mein Team" card states: a running game gets a red outline and a red "läuft" pill, with the next game as a line below. When scorer duty comes before the next game, the amber scorer block moves to the top with its own "in X Min.". Before the first game the card says "Erstes Spiel" and shows no countdown. When everything is played, the card turns white with record, difference, final place and a link to the Tabelle (instead of the spec's 🎉 emoji).
- The Info page pulls "Ende" and "Turnierleitung" out of the FAQ into tiles, and the rules and directions answers get a real link instead of HTML inside the answer.

## Before and after the tournament

Decided in the build ([review-later](../review-later.md)), drawn in `Zustaende.dc.html` since 2026-10-12:

- **Tabelle:** until a group game of the class has a result it shows "Noch keine Ergebnisse. Die Tabelle füllt sich mit dem ersten Spiel."; a group without a played game shows "–" instead of the place.
- **Finalrunde:** "Die Finalrunde beginnt um HH:MM." (earliest placement game) until the first placement result; it stays after that time until a result is entered. Once the Endstand is decided it moves above the bracket.
- **Spielplan:** a "Turnier beendet" card with a link to the Endstand once every non-event game has a result (also when filtered).

## Loading, empty and connection states

One `StatusCard` (white card, muted text, one line) for loading and empty messages ("du" form, e.g. "Passe die Filter an."). "Keine Verbindung – die Daten sind evtl. nicht aktuell." is an amber banner (scorer tones, not the red of running games) above the stale rows, which stay visible. Empty messages are hidden while the banner shows.

## Build differs from the canvas

Where the build departed from the first canvas (reasons in [review-later](../review-later.md)). The canvas was updated to match on 2026-10-12; the list stays as the record of why. The "Not built" items are still drawn but not built.

- **Verkauf:** one row per item, not merged ("Cola · Fanta · Mezzo Mix"), so each keeps its own sold-out flag. The sold-out price is `muted` (canvas #8A968D, too light for text); the red tag and strikethrough carry the meaning. The sold-out row background is `base-200` (canvas #F5F7F4). Categories come from the data, sorted alphabetically.
- **Info:** the "Ende" and "Turnierleitung" tiles and the link buttons are generated from the FAQ data, not hard-coded.
- **Tokens instead of canvas hex values:** `faint` for the cut-off line (canvas #B9C6BB), the bracket connectors (#9AA89D) and the "Mein Team" select border once a team is chosen (#B9C6BB; with no team chosen it stays green, as drawn); `base-300` (= `track`) for the grey quarterfinal box. `ground` is `base-200`.
- **Contrast:** `faint` is borders and connectors only; the "–" placeholders (unplayed score, open Endstand place) are `muted` at full opacity (canvas #8A968D or 0.6 opacity).
- **Tiebreak note** under each Tabelle group: "Reihenfolge: Siegquote (Unentschieden zählt als halber Sieg), dann Differenz, dann direkter Vergleich, dann erzielte Runs." (the canvas wording skips two [ADR-0006](../adr/0006-computed-standings.md) rules).
- **Finalrunde:** placement games that are not part of the drawn bracket (mini round robins such as "Platzierungsrunde 11–13", 2025 data; none planned for 2026) are listed game by game under "Platzierungsspiele", without a table. Any shape other than two halves into a final (with or without quarterfinals) falls back to that list.
- **"Mein Team" card:** radius 16 px (`card`, canvas 18). The all-played state labels the place "Gr.-Platz" when no placement game decides it, and shows one tile row per class for a name used in several classes. When the group stage is over but the team's Finalrunde opponents aren't known yet, the card says "Gruppenphase beendet / Finalrunde folgt – Gegner stehen noch nicht fest." instead.
- **Nav below 360 px:** 13 px text and 4 px padding (a note on the canvas). At any width, labels truncate with an ellipsis rather than scrolling sideways.
- **Quarterfinal cards (compact):** 8 px padding, 4 px gaps (canvas 10/6).
- **Not built:** the "S"/"N" result badges on played games in the team list, the quarterfinal subtitles ("1. Gruppe A gegen 4. Gruppe B …", "Verlierer der Viertelfinals"), the green next-game outline inside the bracket, and the lone "Platz 9" row (9 teams).
