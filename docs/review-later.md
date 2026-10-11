# Review later

What the autonomous run decided, assumed, skipped or deferred, for the owner to look at afterwards. Newest at the bottom of each list. Larger decisions also get an ADR (status **Proposed** until the owner accepts them).

## Decisions made without the owner

- **Section 1 order:** the test runner and check-gate scripts were set up before the dependency update pass, so the update could be verified against the full gate. `npm ci` ran in the main session (no diff to review).

- **ESLint 10 taken** although `eslint-plugin-import`, `eslint-plugin-jsx-a11y` and `eslint-plugin-react` (via `eslint-config-next` 16.4.0) declare peer `eslint` ≤ 9. Clean `npm ci` / `npm install` succeed with peer warnings only, and their rules were checked to fire under ESLint 10. Revert to `^9` if a future install hard-fails.
- **Vitest 5 and `@types/node` 24 taken** beyond the update list: Vitest 5 needs `@types/node` ≥ 22, and Node 24 is what runs locally.
- **Node floor:** isomorphic-dompurify 4 (jsdom 30) needs Node `^22.22.2 || ^24.15.0 || >=26`. Done 2026-10-11: the owner switched the Vercel project from Node 22.x to 24.x. Consider `"engines": { "node": ">=22.22.2" }` in package.json.
- Next 16.4.0 was five days old when taken; pick up 16.4.x patches before the event.
- `npm audit`: 5 high findings remain in `braces`/`micromatch`/`fast-glob` under `@next/eslint-plugin-next` (dev tooling only; the suggested fix would downgrade `eslint-config-next` to 14).
- **Baseline migration recorded without the CLI:** no Supabase CLI or DB password here, so `supabase_migrations.schema_migrations` was created the way the CLI does it (version, statements, name) and the row `20251120000000 initial_schema` inserted via the MCP. `list_migrations` now shows it. The auto-mode classifier blocked this once; the owner approved live DB writes in chat.
- **2026 schema (migrations `20261011054622_2026_edition`, `20261011054638_drop_pg_graphql`):** teams use the natural key (name, class), and `games.hometeam`/`awayteam`/`scorer` stay text columns with composite FKs (`scorer_class` added), so the app's reads didn't change. Halls are a table referenced by `games.location` (text). Refs: `seed:n`, `group:G:n`, `winner:<number>`, `loser:<number>`; checked by format only, the app validates targets. Placement games must have both refs and a label from the start. Full rationale in the migration header.
- **2025 game numbers** were reassigned 1–48 in schedule order (time, then hall), not taken from the old ids. The 17 placement games were converted to refs that reproduce the original teams, with `hometeam`/`awayteam` set to null.
- **Write grants revoked from `anon`** on all public tables (defence in depth on top of RLS); `authenticated` keeps insert/update/delete for the future admin page. When ADR-0007 adds write policies: an UPDATE policy on `teams`/`halls` also rewrites `games` through the `on update cascade` FKs (cascades skip RLS).
- **`supabase/seed.sql` is now a pre-migration backup:** it no longer loads on top of the new schema. It stays as the 2025 reference; section 3 builds its fixtures from it plus the placement mapping.
- **"Bretten" as scorer** is the T-Ball team (`scorer_class = 'T-Ball'`). The next-game-card spec treats "Bretten" as a club matching "Bretten 1/2" by prefix; settle that when building the card (sections 4/6).
- **Standings rules where ADR-0006 is silent** (`lib/standings.ts`): teams with no game played sort last; head-to-head compares win rate only among the level teams, is re-applied to smaller level subsets, and is skipped unless every pair in the level set has played (then runs scored decide); a tie left after runs scored is ordered by name and flagged `tiedWithNext`; seed ties (same place, win rate and difference) go by group letter. `seed:`/`group:` refs resolve even through such name-order ties, so the bracket never stalls; the organizers settle them and the UI can warn. `group:G:n` resolves once that group alone is complete; `seed:n` waits for all groups with games. Places that no game decides (e.g. no 3rd-place game) are left out of the final ranking.
- **Second 2025 typo:** the replay tests found that A1 Mannheim was entered as +71; its four group games give +70. The fixture and ADR-0006 now say so (the ADR only named Herrenberg).

## Assumptions

- npm 11 skips install scripts not covered by `allowScripts` (`sharp`, `unrs-resolver`). Both ship prebuilt binaries, so the build works without them; nothing was approved.

## Skipped items

- TypeScript 7 not taken (stays on 5.9): `npm run lint` crashes with "typescript-eslint does not support TS 7.0" (pulled in by `eslint-config-next` 16.4.0). Revisit when typescript-eslint supports TS 7.
- Sentry: the owner added `NEXT_PUBLIC_SENTRY_DSN` to Vercel Production (2026-10-11); Preview deployments still have none, so they don't report. Still open: optionally `SENTRY_AUTH_TOKEN` for source map upload (build uploads are skipped without it). IPs are kept out by `dataCollection.userInfo: false` (plus a `beforeSend` backstop); additionally enable "Prevent Storing of IP Addresses" in the Sentry project (Settings → Security & Privacy) and set a rate limit / spike protection on the project as a quota backstop. If ad blockers swallow events, `tunnelRoute` in `withSentryConfig` is an option (left off).

## Deferred review findings

Nice-to-haves from the reviews, and findings left after the review cap. Security findings are only written here once they're fixed (the repo is public).

- The schedule sorts by `location` as text now, so "Essensraum" sorts before "Halle 1" at the same time. Order by `halls.sort` when the schedule is rebuilt.
- `app/sell` and `app/faq` still declare local `Item`/`FAQ` types; switch them to the generated aliases in `app/types.ts` when those pages are rebuilt. A typed client (`createClient<Database>`) would remove the `as T[]` cast in `useRealtimeTable`.
- `/standings` orders classes by the generated enum (`Constants`); a class added to the enum without regenerating `lib/database.types.ts` would be dropped silently. Regenerate types after every enum change (or append unknown classes at the end).
- Placeholder wording in the schedule: `Seed n`, `n. Gruppe G`, `Sieger Spiel N`, `Verlierer Spiel N` (N = `games.number`, now also shown on the cards instead of the id). The design's "Sieger HF 2" style would need the referenced game's label; revisit in the redesign.
- `useRealtimeTable` doesn't reset `loading` when `table`/`order` change (every caller passes constants today). Call `setLoading(true)` at the top of the effect if a caller ever passes dynamic arguments.
