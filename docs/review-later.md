# Review later

What the autonomous run decided, assumed, skipped or deferred, for the owner to look at afterwards. Newest at the bottom of each list. Larger decisions also get an ADR (status **Proposed** until the owner accepts them).

## Decisions made without the owner

- **Section 1 order:** the test runner and check-gate scripts were set up before the dependency update pass, so the update could be verified against the full gate. `npm ci` ran in the main session (no diff to review).

- **ESLint 10 taken** although `eslint-plugin-import`, `eslint-plugin-jsx-a11y` and `eslint-plugin-react` (via `eslint-config-next` 16.4.0) declare peer `eslint` ≤ 9. Clean `npm ci` / `npm install` succeed with peer warnings only, and their rules were checked to fire under ESLint 10. Revert to `^9` if a future install hard-fails.
- **Vitest 5 and `@types/node` 24 taken** beyond the update list: Vitest 5 needs `@types/node` ≥ 22, and Node 24 is what runs locally.
- **Node floor:** isomorphic-dompurify 4 (jsdom 30) needs Node `^22.22.2 || ^24.15.0 || >=26`. The Vercel project's Node setting couldn't be checked (connector has no access to the scope); it must be 24.x (or 22.22.2+). Consider `"engines": { "node": ">=22.22.2" }` in package.json.
- Next 16.4.0 was five days old when taken; pick up 16.4.x patches before the event.
- `npm audit`: 5 high findings remain in `braces`/`micromatch`/`fast-glob` under `@next/eslint-plugin-next` (dev tooling only; the suggested fix would downgrade `eslint-config-next` to 14).
- **Baseline migration recorded without the CLI:** no Supabase CLI or DB password here, so `supabase_migrations.schema_migrations` was created the way the CLI does it (version, statements, name) and the row `20251120000000 initial_schema` inserted via the MCP. `list_migrations` now shows it. The auto-mode classifier blocked this once; the owner approved live DB writes in chat.
- **2026 schema (migrations `20261011054622_2026_edition`, `20261011054638_drop_pg_graphql`):** teams use the natural key (name, class), and `games.hometeam`/`awayteam`/`scorer` stay text columns with composite FKs (`scorer_class` added), so the app's reads didn't change. Halls are a table referenced by `games.location` (text). Refs: `seed:n`, `group:G:n`, `winner:<number>`, `loser:<number>`; checked by format only, the app validates targets. Placement games must have both refs and a label from the start. Full rationale in the migration header.
- **2025 game numbers** were reassigned 1–48 in schedule order (time, then hall), not taken from the old ids. The 17 placement games were converted to refs that reproduce the original teams, with `hometeam`/`awayteam` set to null.
- **Write grants revoked from `anon`** on all public tables (defence in depth on top of RLS); `authenticated` keeps insert/update/delete for the future admin page. When ADR-0007 adds write policies: an UPDATE policy on `teams`/`halls` also rewrites `games` through the `on update cascade` FKs (cascades skip RLS).
- **`supabase/seed.sql` is now a pre-migration backup:** it no longer loads on top of the new schema. It stays as the 2025 reference; section 3 builds its fixtures from it plus the placement mapping.
- **"Bretten" as scorer** is the T-Ball team (`scorer_class = 'T-Ball'`). The next-game-card spec treats "Bretten" as a club matching "Bretten 1/2" by prefix; settle that when building the card (sections 4/6).

## Assumptions

- npm 11 skips install scripts not covered by `allowScripts` (`sharp`, `unrs-resolver`). Both ship prebuilt binaries, so the build works without them; nothing was approved.

## Skipped items

- TypeScript 7 not taken (stays on 5.9): `npm run lint` crashes with "typescript-eslint does not support TS 7.0" (pulled in by `eslint-config-next` 16.4.0). Revisit when typescript-eslint supports TS 7.
- Sentry: the Vercel env var could not be set from here. Owner: add `NEXT_PUBLIC_SENTRY_DSN` to Vercel (Production + Preview); optionally `SENTRY_AUTH_TOKEN` for source map upload (build uploads are skipped without it). IPs are kept out by `dataCollection.userInfo: false` (plus a `beforeSend` backstop); additionally enable "Prevent Storing of IP Addresses" in the Sentry project (Settings → Security & Privacy) and set a rate limit / spike protection on the project as a quota backstop. If ad blockers swallow events, `tunnelRoute` in `withSentryConfig` is an option (left off).

## Deferred review findings

Nice-to-haves from the reviews, and findings left after the review cap. Security findings are only written here once they're fixed (the repo is public).

- The schedule sorts by `location` as text now, so "Essensraum" sorts before "Halle 1" at the same time. Order by `halls.sort` when the schedule is rebuilt.
- `app/sell` and `app/faq` still declare local `Item`/`FAQ` types; switch them to the generated aliases in `app/types.ts` when those pages are rebuilt. A typed client (`createClient<Database>`) would remove the `as T[]` cast in `useRealtimeTable`.
- The schedule still shows `#{game.id}`, not `games.number` (section 6 drops the `#id`).
