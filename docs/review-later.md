# Review later

What the autonomous run decided, assumed, skipped or deferred, for the owner to look at afterwards. Newest at the bottom of each list. Larger decisions also get an ADR (status **Proposed** until the owner accepts them).

## Open

- **Canvas updates for the owner** (docs/design/README.md "Build differs from the canvas" is already updated): Verkauf one row per item, sold-out price `muted`, row `base-200`. Main/SpielplanAlle "–" in `muted` at full opacity, select border `faint` once a team is chosen, plus the "Turnier beendet" card. Tabelle new tiebreak wording, `faint` cut-off line, before-first-result state. Finalrunde/FinalrundeVF `faint` connectors, `base-300` QF box, compact QF cards (8/4 px), Platzierungsspiele list, "Die Finalrunde beginnt um HH:MM.", Endstand above the bracket once decided (QF subtitles, green outline in the bracket and the lone "Platz 9" row stay drawn: not built, still open). "Mein Team" card: "Gruppenphase beendet / Finalrunde folgt" state, "Gr.-Platz", 16 px radius; S/N badges not built. New frames for loading/empty/"Keine Verbindung". A note for the nav below 360 px.
- TypeScript 7: stays on 5.9 until typescript-eslint (via `eslint-config-next`) supports it; lint crashes under TS 7.
- ESLint 10 runs with plugins whose peer range is ≤ 9: revert to `^9` if an install ever hard-fails.

## Deferred review findings

Nice-to-haves from the reviews, and findings left after the review cap. Security findings are only written here once they're fixed (the repo is public).

- `engines.node` is `>=22.22.2` as agreed. The real isomorphic-dompurify/jsdom range is `^22.22.2 || ^24.15.0 || >=26.0.0`, so 24.0–24.14 pass the field but not the dependency, and Vercel may move to Node 26 once it ships. Tighten to `^22.22.2 || ^24.15.0` or `24.x` if that matters. The lockfile's root entry doesn't mirror `engines` (syncing it pulled in unrelated wasm packages).
- Class-aware "Mein Team": `selectedTeam` is now stored as `"<class>|<name>"`. An old name-only value is never rewritten. If the name is in exactly one playing class, it acts as that team. If it's in several, the select shows an extra "<name> (alle Klassen)" row and the value matches every class (a builder addition so the select doesn't claim "Alle Teams" while filtering). On Tabelle/Finalrunde, `teamNameInClass` only looks at the stored value, not at which teams actually play. So an old name can also highlight a same-named team registered in another class that has no games yet. That case is purely visual and unlikely.
