# Review later

What the autonomous run decided, assumed, skipped or deferred, for the owner to look at afterwards. Newest at the bottom of each list. Larger decisions also get an ADR (status **Proposed** until the owner accepts them).

## Open

- TypeScript 7: stays on 5.9 until typescript-eslint (via `eslint-config-next`) supports it; lint crashes under TS 7.
- ESLint 10 runs with plugins whose peer range is ≤ 9: revert to `^9` if an install ever hard-fails.
- Schedule loader: `npm run schedule:sql` runs TypeScript with plain `node` plus `scripts/register-ts.mjs`, a 30-line resolve hook for the `@/` alias and extensionless imports. The alternative was a dependency (tsx) or editing app imports. The hook is why `lib/scheduleCheck.ts` can import `lib/cutOff.ts` unchanged.
- Schedule loader: refs to earlier games are written by label only (`winner:Halbfinale 1`); numeric `winner:12` is rejected because numbers are assigned by the script. Events need a `class` (the Spielplan class filter hides events of other classes), so a Siegerehrung for all classes is one row per class.
- Schedule loader: "same time slot" means identical start time; the checker can't know slot lengths. Events don't clash with each other (two classes can have the same Mittagspause in the Foyer) but clash with games in that hall. Placement-game participants are unknown before the group stage, so only their scorers are checked for double booking.
- Schedule loader: duplicate labels are only warned about when they are not a round robin (three or more games linked through shared refs) and nothing references them. Referenced duplicates are errors.
- Schedule loader: hall `sort` is the position in the file's `halls` array (1..n), not 99 for the event room as in the 2025 migration.
- Schedule loader: the 2025 data had scorers on two games in one slot (T-Ball "Bretten", repeatedly) and one scorer playing in another hall (Schüler "Bretten 2", 14:00). All three are errors (owner decision 2026-10-14: a team scores one game at a time). `lib/fixtures/schedule2025.ts` drops the conflicting duties, keeping the first per slot.
- Schedule loader: the SQL deletes and re-inserts games, so game ids continue from the identity sequence instead of restarting; nothing in the app relies on ids.

## Deferred review findings

Nice-to-haves from the reviews, and findings left after the review cap. Security findings are only written here once they're fixed (the repo is public).

- Class-aware "Mein Team": `selectedTeam` is now stored as `"<class>|<name>"`. An old name-only value is never rewritten. If the name is in exactly one playing class, it acts as that team. If it's in several, the select shows an extra "<name> (alle Klassen)" row and the value matches every class (a builder addition so the select doesn't claim "Alle Teams" while filtering). On Tabelle/Finalrunde, `teamNameInClass` only looks at the stored value, not at which teams actually play. So an old name can also highlight a same-named team registered in another class that has no games yet. That case is purely visual and unlikely.
- `npm audit` (2026-10-14, after the Next 16.4.1 bump): 5 high findings, all `braces` 3.0.3 (GHSA-vfj7-8cjw-p6xm, stack-exhaustion DoS) via `eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob` → `micromatch`. Lint-time only, never shipped. The only offered fix downgrades `eslint-config-next` to 14.x; wait for an upstream bump instead.
