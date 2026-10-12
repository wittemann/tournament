# Review later

What the autonomous run decided, assumed, skipped or deferred, for the owner to look at afterwards. Newest at the bottom of each list. Larger decisions also get an ADR (status **Proposed** until the owner accepts them).

## Open

- **Canvas updates for the owner** (docs/design/README.md "Build differs from the canvas" is already updated): Verkauf one row per item, sold-out price `muted`, row `base-200`. Main/SpielplanAlle "–" in `muted` at full opacity, select border `faint` once a team is chosen, plus the "Turnier beendet" card. Tabelle new tiebreak wording, `faint` cut-off line, before-first-result state. Finalrunde/FinalrundeVF `faint` connectors, `base-300` QF box, compact QF cards (8/4 px), Platzierungsspiele list, "Die Finalrunde beginnt um HH:MM.", Endstand above the bracket once decided (QF subtitles, green outline in the bracket and the lone "Platz 9" row stay drawn: not built, still open). "Mein Team" card: "Gruppenphase beendet / Finalrunde folgt" state, "Gr.-Platz", 16 px radius; S/N badges not built. New frames for loading/empty/"Keine Verbindung". A note for the nav below 360 px.
- TypeScript 7: stays on 5.9 until typescript-eslint (via `eslint-config-next`) supports it; lint crashes under TS 7.
- ESLint 10 runs with plugins whose peer range is ≤ 9: revert to `^9` if an install ever hard-fails.

## Deferred review findings

Nice-to-haves from the reviews, and findings left after the review cap. Security findings are only written here once they're fixed (the repo is public).
