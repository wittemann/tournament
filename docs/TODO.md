# TODO for the 2026 edition

Everything that still needs fixing or changing, in rough order. Each item links to where it was decided or found. Tick items off as they land. Feature details live in the [specs](specs/README.md).

Already done on `rework`: shared Supabase client and `useRealtimeTable` hook, server-side layout with metadata, hydration-safe filters, hidden score for unplayed games, live "now" line on desktop, schema and 2025 data exported, ADRs.

## 1. Housekeeping (do first)

- [ ] Run `npm ci`. The local `node_modules` has Next 16.0.3, but the lockfile pins the security-fixed 16.0.10.
- [ ] Dependency update pass: Next 16.4, React 19.3, supabase-js 2.117, daisyUI 5.7, Tailwind 4.3, DOMPurify ([ADR-0002](adr/0002-tech-stack.md)). Major jumps (isomorphic-dompurify 4, ESLint 10, TypeScript 7) only if they upgrade cleanly.
- [ ] Set up a test runner (Vitest). Nothing in the repo is tested yet, and the standings logic must be.
- [ ] Replace the create-next-app README with a real one: setup, env vars, and a pre-event runbook (restore the Supabase project, apply migrations, load games and items, invite admins).
- [ ] Add `.env.example` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] Mark the baseline migration as applied in the live project (`supabase migration repair --status applied 20251120000000`) before pushing any new migration ([ADR-0005](adr/0005-schema-as-migrations.md)).

## 2. Database (one migration)

- [ ] **Teams as data, not free text.** `games.hometeam`/`awayteam`/`scorer` are free text today. One typo ("Stuttgart1") would silently create a new team in the standings. Add a `teams` table (name, class, group) and reference it from `games`, or at least use a check/enum. This replaces the `team` enum, which needs a migration every year.
- [ ] Add to `games`: `stage` (`group` | `placement`), `label` (e.g. "Halbfinale 1"), `home_ref`/`away_ref` for placeholders (`seed:1`, `winner:41`, `loser:42`) ([ADR-0006](adr/0006-computed-standings.md), [playoff-bracket spec](specs/playoff-bracket.md)).
- [ ] **Game number separate from the database id.** The schedule shows `#{game.id}` (49, 32, 50, …), which looks random, and placeholders like "Sieger #41" must reference something stable. Add `games.number`.
- [ ] Constraint: placement games can't end in a tie (equal scores rejected) ([ADR-0006](adr/0006-computed-standings.md)).
- [ ] Drop the `standings` table once the computed standings are live. Its 2025 contents stay in `supabase/seed.sql`.
- [ ] Drop the duplicate unique index `games_id_key` (the same as the primary key; flagged by the Supabase performance check).
- [ ] `items.price` is `real` (floating point). Switch it to `numeric(6,2)` for money.
- [ ] Optional: `faq.sort` column, so FAQs aren't just sorted alphabetically by question.
- [ ] Optional: disable the unused GraphQL extension (`pg_graphql`). The Supabase security check flags that all tables are visible over GraphQL. The data is public anyway, so this is just cleanup.
- [ ] Generate `app/types.ts` from the schema (`supabase gen types`) instead of maintaining it by hand ([ADR-0005](adr/0005-schema-as-migrations.md)).

## 3. Computed standings (must-have)

- [ ] `lib/standings.ts`: group table by win rate (tie = ½ win), run difference, head-to-head, runs scored. Then seeding across groups and resolution of placeholders ([ADR-0006](adr/0006-computed-standings.md)).
- [ ] Tests replaying the 2025 data: must reproduce the hand-entered group tables (except the Herrenberg typo: +15, not +14) and the 2025 final ranking.
- [ ] Tests for the cases 2025 didn't have: tied games, a three-way tie, an unfinished group.
- [ ] Switch `/standings` from the `standings` table to the computed tables, and show ties (W–L–T).
- [ ] Remove the hardcoded classes `'Schüler'`/`'T-Ball'` in `app/standings/page.tsx`. Derive the classes from the data.
- [ ] Show the resolved team names for placement games in the schedule ("Seed 1 → Mannheim").

## 4. Schedule page fixes

- [ ] **Loading state.** Before data arrives, every page shows its empty message ("Keine Spiele gefunden. Bitte passen Sie die Filter an.", "Keine FAQs verfügbar.", "Keine Artikel verfügbar."). Add a loading state to `useRealtimeTable` and show the empty message only after loading.
- [ ] **Stale data after the phone sleeps.** A phone in a pocket loses the realtime connection, and nothing reloads when it wakes up. Refetch on `visibilitychange` / reconnect in `useRealtimeTable`. This is the most likely cause of "the app shows an old score" on the day.
- [ ] **Errors are invisible.** Fetch errors only go to `console.error`, and a missing env var throws inside an effect. Show a small "Keine Verbindung" banner instead.
- [ ] The team filter lists scorer-only names like "Bretten" (a club, not a team). Build the team list from teams that actually play (or from the `teams` table) ([next-game-card spec](specs/next-game-card.md)).
- [ ] The class badge colour (`'Schüler'` → green, else amber) is duplicated in the mobile and desktop views. Extract it into one place.
- [ ] Two components subscribing to the same table on one page would both use the channel name `games-changes`. Make channel names unique per hook instance before the bracket and next-game card add more subscribers.

## 5. Smaller UI and consistency fixes

- [ ] FAQ accordion: add `aria-expanded`/`aria-controls` to the question buttons. Open external links (`a[href^=http]`) in a new tab with `rel="noopener"`.
- [ ] The sales page uses hand-styled Tailwind tables, while the other pages use daisyUI `table`. Make it consistent.
- [ ] Remove the leftover `<div>` wrappers around the filter fieldsets in `GamesTable`.
- [ ] Check every page at phone width in light and dark mode.

## 6. Content for 2026 (data, not code)

- [ ] FAQ: links point to the 2025 PDFs (`…/2025/12/Regeln-X-Mas-Ball-2025.pdf`, `Anfahrt_Parken.pdf`). Update them for 2026.
- [ ] FAQ typos: "Her findest du" → "Hier", "Sporthall" → "Sporthalle", "Medallien" → "Medaillen".
- [ ] Item names: remove the trailing space in "Süßigkeiten / Chips / Erdnüsse ". Reset the sold-out flags.
- [ ] Load the 2026 teams, groups and schedule (with placeholders for placement games).

## 7. Features (see specs)

- [ ] ["Mein Team" card](specs/next-game-card.md): next game and scorer duty. Small, and doesn't depend on anything above.
- [ ] [Playoff bracket](specs/playoff-bracket.md): needs section 3.
- [ ] [Admin page](adr/0007-admin-results-entry.md) for scores and sold-out flags (optional, ADR still Proposed): Supabase Auth, RLS write policies, rejects tied placement scores.
