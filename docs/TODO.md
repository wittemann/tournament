# TODO for the 2026 edition

Everything that still needs fixing or changing, in rough order. Each item links to where it was decided or found. Tick items off as they land. Feature details live in the [specs](specs/README.md).

Already done on `rework`: shared Supabase client and `useRealtimeTable` hook, server-side layout with metadata, hydration-safe filters, hidden score for unplayed games, live "now" line on desktop, schema and 2025 data exported, ADRs.

## How we work

This run is autonomous: no human review before commits. Decisions that need the owner's look later go into [review-later](review-later.md).

**Tags** at the end of each item: `haiku` = small, mechanical, follows an existing pattern; `sonnet` = default feature work; `opus` = tricky logic, security, realtime, schema, or anything hard to review afterwards. **(owner)** = needs Martin, skipped in this run. "main thread decides" = an open decision, settled by the main session and documented. Bump the model when a result needs rework.

Every item goes through these steps:

1. **Brief:** the main session hands the item to a sub-agent on the tagged model, with the relevant ADRs/specs/design, the files to touch, "don't commit", and the check commands
2. **Build:** the sub-agent writes only as much code as the item needs. Logic comes with tests. Library APIs are checked against current docs
3. **Check:** `npm run format:check`, `lint`, `typecheck`, `test`, `build` pass (the scripts exist once section 1 is done). Visual changes are checked in the browser pane at 360–430 px, light mode
4. **Review:** a read-only sub-agent on another model reviews the uncommitted diff for correctness, architecture and security: `haiku` → `sonnet`, `sonnet` → `opus`, `opus` → `sonnet` (plus a second `opus` review for security-relevant work). Blockers and should-fix findings go back to a build sub-agent, then review again. Nice-to-haves go to [review-later](review-later.md)
5. **Cap:** after 3 review rounds, bump the model once; if findings remain, log them in [review-later](review-later.md) and move on
6. **Commit:** the main session commits (sub-agents never do), one small commit per item, Conventional Commits, and ticks the item off in the same commit
7. **Push:** to `main` when a section is done

**Parallel only when it's clearly safe:** disjoint files, separate worktrees, no shared migration, lockfile, theme or shared component. In doubt, sequential. Commits always happen one at a time in the main session.

**Progress bar:** the main session reports to the savvy-progress panel. When a section starts, it calls `progress` with the section as `title`, its items as `tasks` (tier: `haiku` → `light`, `sonnet` → `medium`, `opus` → `heavy`), `total` and phase `delegate`. It calls it again on every phase switch (`review`, back to `delegate`), with `done` raised each time an item is committed, and with `finished: true` when the section is pushed. Each task title must match the Agent `description` used for that item word for word. Build and review sub-agents are told in their brief to call `step` right after reading it (`total` = their plan in 3–8 steps, `done: 0`) and again after each step. If the tools aren't available, skip this; it only draws the bar.

**Deploys:** every push to `main` goes straight to Vercel production (checked 2026-10-11), and the live Supabase project is shared with it. That's accepted for this run: nobody uses the app before the event, so the live site may be half-finished between sections.

**Resuming:** the ticks here and [review-later](review-later.md) are the state. After an interruption, continue with the first unticked item that isn't **(owner)**.

## 1. Housekeeping (do first)

- [x] Run `npm ci`. The local `node_modules` has Next 16.0.3, but the lockfile pins the security-fixed 16.0.10. · `haiku`
- [x] Dependency update pass: Next 16.4, React 19.3, supabase-js 2.117, daisyUI 5.7, Tailwind 4.3, DOMPurify ([ADR-0002](adr/0002-tech-stack.md)). Major jumps (isomorphic-dompurify 4, ESLint 10, TypeScript 7) only if they pass the check gate without code changes; otherwise stay on the current major and log it in review-later. · `sonnet`
- [x] Set up a test runner (Vitest). Nothing in the repo is tested yet, and the standings logic must be. · `haiku`
- [x] Scripts for the check gate: `format` / `format:check` (Prettier), `typecheck` (`tsc --noEmit`), `test`. Format the codebase once in its own commit. · `haiku`
- [x] Replace the create-next-app README with a real one: setup, env vars, and a pre-event runbook (restore the Supabase project, apply migrations, load games and items, invite admins). · `sonnet`
- [x] Add `.env.example` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. · `haiku`
- [x] **Sentry integration** (`@sentry/nextjs`): client and server errors, plus realtime/fetch failures from `useRealtimeTable`. Sentry org `wittemann` (EU region, `de.sentry.io`), project `tournament`. The DSN is already in the local `.env.local` as `NEXT_PUBLIC_SENTRY_DSN`; add the key (no value) to `.env.example` and the value to Vercel. An auth token for source maps is optional and never committed. Privacy: `sendDefaultPii: false`, no IP addresses, no session replay, low trace sample rate. Check the current Sentry Next.js docs first. · `sonnet`
- [x] Mark the baseline migration as applied in the live project (`supabase migration repair --status applied 20251120000000`) before pushing any new migration ([ADR-0005](adr/0005-schema-as-migrations.md)). · `sonnet`

## 2. Database (one migration)

- [x] **Teams as data, not free text.** `games.hometeam`/`awayteam`/`scorer` are free text today. One typo ("Stuttgart1") would silently create a new team in the standings. Add a `teams` table (name, class, group) and reference it from `games`. This replaces the `team` enum, which needs a migration every year. A team is **name + class** (decided 2026-10-11): in 2025, Karlsruhe, Nagold, Remchingen, Schriesheim and Stuttgart 1/2 had a team in both classes. `scorer` references a team of any class (the T-Ball team "Bretten" kept score in Schüler games). The persisted "Mein Team" selection stores the class with the name. Convert the 2025 data in the live database to the new structure, including groups and placeholders (approved; the original stays in `seed.sql`). · `opus`
- [x] **New age class "Jugend"** (third class next to Schüler and T-Ball). `games.class` is the `class` enum, so inserting a Jugend game fails until the value is added: `alter type public.class add value 'Jugend';`. The app parts are listed in sections 3 and 4. · `haiku`
- [x] **Halls as data.** `games.location` is the `location` enum (`Halle 1`–`3`, `Essensraum`), so every extra hall needs a migration. The number of halls is only known once the 2026 schedule exists (section 9), so make halls data like teams (a `halls` table with a sort order, or a text column with a check), not a hard-coded enum value. The app builds the hall filter from the data. · `opus`
- [x] Add to `games`: `stage` (`group` | `placement`), `label` (e.g. "Halbfinale 1"), `home_ref`/`away_ref` for placeholders (`seed:1`, `winner:41`, `loser:42`). Resolved teams are computed in the app only, never written back; `hometeam`/`awayteam` stay empty on placement games (decided 2026-10-11) ([ADR-0006](adr/0006-computed-standings.md), [playoff-bracket spec](specs/playoff-bracket.md)). · `opus`
- [x] **Game number separate from the database id.** The schedule shows `#{game.id}` (49, 32, 50, …), which looks random, and placeholders like "Sieger #41" must reference something stable. Add `games.number`. · `sonnet`
- [x] Constraint: placement games can't end in a tie (equal scores rejected) ([ADR-0006](adr/0006-computed-standings.md)). · `sonnet`
- [x] Drop the `standings` table once the computed standings are live. Its 2025 contents stay in `supabase/seed.sql`. · `haiku`
- [x] Drop the duplicate unique index `games_id_key` (the same as the primary key; flagged by the Supabase performance check). · `haiku`
- [x] `items.price` is `real` (floating point). Switch it to `numeric(6,2)` for money. · `sonnet`
- [x] Optional: `faq.sort` column, so FAQs aren't just sorted alphabetically by question. · `haiku`
- [x] Optional: `faq.link_url` / `faq.link_label`, so an answer can carry one proper link button as in the [design](design/README.md) instead of HTML in the text. If all links move there, the answers become plain text and DOMPurify ([ADR-0008](adr/0008-faq-sanitized-html.md)) can go. · `sonnet`
- [x] Optional: disable the unused GraphQL extension (`pg_graphql`). The Supabase security check flags that all tables are visible over GraphQL. The data is public anyway, so this is just cleanup. · `haiku`
- [x] Generate `app/types.ts` from the schema (`supabase gen types`) instead of maintaining it by hand ([ADR-0005](adr/0005-schema-as-migrations.md)). · `sonnet`

## 3. Computed standings (must-have)

- [x] `lib/standings.ts`: group table by win rate (tie = ½ win), run difference, head-to-head, runs scored. Then seeding across groups and resolution of placeholders ([ADR-0006](adr/0006-computed-standings.md)). · `opus`
- [x] Tests replaying the 2025 data: must reproduce the hand-entered group tables (except the Herrenberg typo: +15, not +14) and the 2025 final ranking. · `opus`
- [x] Tests for the cases 2025 didn't have: tied games, a three-way tie, an unfinished group. · `sonnet`
- [x] Switch `/standings` from the `standings` table to the computed tables, and show ties (W–L–T). · `sonnet`
- [x] Remove the hardcoded classes `'Schüler'`/`'T-Ball'` in `app/standings/page.tsx`. Derive the classes from the data. Until then, Jugend standings would not show up at all. · `sonnet`
- [x] Show the resolved team names for placement games in the schedule ("Seed 1 → Mannheim"). · `opus`

## 4. Schedule page fixes

- [x] **Loading state.** Before data arrives, every page shows its empty message ("Keine Spiele gefunden. Bitte passen Sie die Filter an.", "Keine FAQs verfügbar.", "Keine Artikel verfügbar."). Add a loading state to `useRealtimeTable` and show the empty message only after loading. · `sonnet`
- [x] **Stale data after the phone sleeps.** A phone in a pocket loses the realtime connection, and nothing reloads when it wakes up. Refetch on `visibilitychange` / reconnect in `useRealtimeTable`. This is the most likely cause of "the app shows an old score" on the day. · `opus`
- [x] **Errors are invisible.** Fetch errors only go to `console.error`, and a missing env var throws inside an effect. Show a small "Keine Verbindung" banner instead. · `sonnet`
- [x] The team filter lists scorer-only names like "Bretten" (a club, not a team). Build the team list from teams that actually play (or from the `teams` table) ([next-game-card spec](specs/next-game-card.md)). · `sonnet`
- [x] The class badge colour (`'Schüler'` → green, else amber) is duplicated in the mobile and desktop views. Extract it into one place, and give Jugend its own colour (right now it would get T-Ball's amber). Covered by the `ClassTag` item in section 6. · `haiku`
- [x] Two components subscribing to the same table on one page would both use the channel name `games-changes`. Make channel names unique per hook instance before the bracket and next-game card add more subscribers. · `sonnet`

## 5. Smaller UI and consistency fixes

- [x] FAQ accordion: add `aria-expanded`/`aria-controls` to the question buttons. Open external links (`a[href^=http]`) in a new tab with `rel="noopener"`. · `sonnet`
- [x] Check every page at phone width (light mode only, see section 6). · `sonnet`

## 6. Redesign

Everything needed to build the [design](design/README.md) (canvas, colours, components, decisions). Build the foundation first, since every page uses it. Each page can then be switched over on its own. Where an item depends on another section, it says so.

**Open decisions (settle before or while building)**

- [x] **Dark mode:** dropped for 2026 (decided 2026-10-10). One light daisyUI theme with `color-scheme: light`, so phones in dark mode don't get dark native controls on a light page. Remove the `dark:` classes.
- [x] **Desktop / `lg`:** no separate layout (decided 2026-10-10). Keep the phone column, centred at about 480 px wide, on every screen size. That also removes the separate desktop table in `GamesTable`.
- [x] **Info tiles** ("Ende", "Turnierleitung"): taken from the data (decided 2026-10-11). Section 9 rules out hard-coding "Ende". FAQ rows get optional `tile_title` / `tile_value` / `tile_detail` columns; a row with a `tile_title` also shows as a tile. The link buttons come from FAQ rows with `link_url` / `link_label`.
- [x] **Verkauf:** one row per item (decided 2026-10-11). Merging "Cola · Fanta · Mezzo Mix" would lose the per-item sold-out flag, and grouping by price in code would also merge unrelated drinks (Glühwein, Mineralwasser are 2,50 € too). The canvas gets updated in the Finish step.
- [ ] **Higher-res kangaroo:** [`public/kangaroo.png`](../public/kangaroo.png) is cut from the logo and only 90 px wide, so it looks soft on phones. Ask the club for a larger original or an SVG. · **(owner)**

**Foundation**

- [x] daisyUI theme `xmasball` with the colours from [docs/design](design/README.md#colours): `primary` = green, `base-100` = white, `base-200` = ground, `base-content` = ink, plus CSS variables for the extra tokens (`live`, `scorer-*`, `win-*`, `loss-*`, class colours, `track`, `line`). Use the theme tokens everywhere; no more hard-coded `green-700` / `gray-*` classes in `layout.tsx` and `Nav.tsx`. · `sonnet`
- [x] Fonts: Barlow (400–700) and Barlow Condensed (600/700) via `next/font/google`, exposed as CSS variables / Tailwind font families (`font-sans`, `font-display`). · `haiku`
- [x] Header: rounded green card with the kangaroo, "XMAS-BALL", "Bretten Kangaroos" and the current time as a pill (from `useNow`). Replaces the full-width green bar and `logo.png` in `layout.tsx`. · `sonnet`
- [x] Main navigation: five pill tabs (Spielplan, Tabelle, Finalrunde, Verkauf, Info), each as wide as its text, current page as a dark pill with `aria-current="page"`. No horizontal scrolling. Check that it still fits at 360 px (and decide what happens at 320 px, e.g. smaller text). · `sonnet`
- [x] Page background `ground`, content on white cards with the radii from the design (header 20, cards 16, game cards 14, controls 12). · `haiku`

**Shared components**

- [x] `SegmentedControl`: grey track, white selected option, ≥ 40 px high, optional uppercase label in front (fixed width so several rows line up). Options come from the data. Proper semantics: a radio group, not a fake tab list, since it filters. · `sonnet`
- [x] `ClassTag` with one colour map per class (Schüler green, T-Ball orange, Jugend blue; classes taken from the data, unknown classes get a neutral tag). · `haiku`
- [x] `GameCard` with all states from the design: upcoming (score "–"), running (red outline, "läuft"), played (muted, winner bold), the selected team's next game (green outline), placement game with label ("Platz 9/10") and placeholders ("5. Gruppe A", "Sieger HF 2", needs section 3). No `#id`. Optional "Scorer: …" line in the all-teams view. · `opus`
- [x] Definition of "läuft": started, no result yet, at most 30 minutes ago. Same constant as in the [next-game-card spec](specs/next-game-card.md), shared in `lib/`. · `haiku`
- [x] `EventCard` for rows with `eventname` (Siegerehrung, Mittagspause): dark card, condensed uppercase title. · `haiku`
- [ ] "Jetzt" line in the new style (red dot, line, "Jetzt · 14:18"). Shown in both Spielplan views. · `sonnet`
- [ ] Loading, empty and error states in the new style (not designed yet, decide later; keep them simple: a muted card with one line). Builds on the loading/error items in section 4. · `sonnet`
- [ ] Before/after the tournament: how Spielplan, Tabelle and Finalrunde look before the first result and after the final (not designed yet, decide later). · main thread decides, then `sonnet`

**Spielplan**

- [ ] "Mein Team" select as the main control (48 px, placeholder "Team wählen – nächstes Spiel sehen"). Same persisted `selectedTeam` as now. · `sonnet`
- [ ] Class and hall filters as two `SegmentedControl` rows ("Klasse": Alle · Schüler · T-Ball · Jugend, "Halle": Alle · 1 · 2 · 3 · 4 · 5), replacing the three selects. Hall labels are shortened ("Halle 3" → "3", full name as `aria-label`); Essensraum is left out because only events happen there. Selections stay persisted. · `sonnet`
- [ ] **All teams view** (no team selected): games grouped by time slot. Each slot heading shows its status ("beendet", "läuft", "in 12 Min."); each card shows hall and class tag. · `opus`
- [ ] **Team view**: the ["Mein Team" card](specs/next-game-card.md) in the design's style (green card, big time and hall, "in 12 Min." pill, amber scorer strip), then all of the team's games incl. scorer duties as dashed amber cards, with the team's record ("1 S · 1 N", needs section 3) in the heading. Supersedes the card's "Design notes" in the spec. · `opus`
- [ ] All four card states from the design board (`MeinTeamZustaende`): game running, scorer duty first, before the first game, all games played (record, difference, place, link to the Tabelle; needs section 3 for record and place). · `sonnet`

**Tabelle**

- [ ] Class `SegmentedControl` instead of stacked class sections. Classes from the data (also needed for Jugend, section 3). · `sonnet`
- [ ] One card per group: "#", Team, "S–N" (W–L–T once ties exist, section 3), "Diff" (green / red). Status in the card heading: "8 von 10 Spielen" or "abgeschlossen". · `sonnet`
- [ ] Highlight the selected team's row (amber, "Mein Team" tag), using the same persisted `selectedTeam`. · `haiku`
- [ ] Dashed cut-off line under the last place that reaches the semifinals, derived from the placement structure (ADR-0006), plus the tiebreak note under each group, worded to match ADR-0006. · `sonnet`

**Finalrunde** (needs section 3 and the [bracket spec](specs/playoff-bracket.md))

- [ ] Own route `/finalrunde` with its nav tab. This answers open question 2 of the bracket spec. · `haiku`
- [ ] Class `SegmentedControl`. · `haiku`
- [ ] Bracket as in the design: two columns, one per half; semifinals joined to the final with CSS borders; final as a dark card with the trophy; "Spiel um Platz 3"; placement games as a list; own team highlighted; "Endstand" once the final is played. · `opus`
- [ ] Quarterfinal variant (8 teams): each column groups its two quarterfinals above its semifinal; seeds shown as "A1", "B4"; "Platz 5–8" block for the quarterfinal losers. More than 8 teams would need one tab per round (out of scope unless the 2026 schedule needs it). · `opus`

**Verkauf**

- [ ] One card per category (Essen, Getränke, Merchandise), item name left, price right in the condensed font ("3,50 €"). No category jump buttons. · `sonnet`
- [ ] Sold-out items sorted to the bottom of their card: greyed out, red "Ausverkauft" tag, price crossed out. Still live via realtime. · `sonnet`

**Info**

- [ ] Quick-fact tiles ("Ende", "Turnierleitung") and two green link buttons (Regeln PDF, Anfahrt PDF), depending on the decision above. · `sonnet`
- [ ] FAQ as an accordion in one white card, chevron rotates when open, link answers show a proper link. Includes the accessibility item in section 5. · `sonnet`

**Finish**

- [ ] Check every page at 360–430 px phone width; touch targets ≥ 40 px; text contrast ≥ 4.5:1 (the class tags and muted greys are close to the limit, so measure them). · `sonnet`
- [ ] Test on a real phone in the hall (sunlight / bright hall lighting, one-handed use). · **(owner)**
- [ ] Where the build has to differ from the canvas, update the canvas and [docs/design](design/README.md) so they stay the source of truth. · `sonnet` for docs/design, **(owner)** for the canvas

## 7. Content for 2026 (data, not code)

- [ ] FAQ: links point to the 2025 PDFs (`…/2025/12/Regeln-X-Mas-Ball-2025.pdf`, `Anfahrt_Parken.pdf`). Update them for 2026. · **(owner)** (2026 PDF links)
- [ ] FAQ typos: "Her findest du" → "Hier", "Sporthall" → "Sporthalle", "Medallien" → "Medaillen". · `haiku`
- [ ] Item names: remove the trailing space in "Süßigkeiten / Chips / Erdnüsse ". Reset the sold-out flags. · `haiku`

## 8. Features (see specs)

The "Mein Team" card and the bracket are built in the redesign's style (section 6).

- [ ] ["Mein Team" card](specs/next-game-card.md): next game and scorer duty. Small, and doesn't depend on anything above. · built in section 6
- [ ] [Playoff bracket](specs/playoff-bracket.md): needs section 3. · built in sections 3 and 6
- [ ] [Admin page](adr/0007-admin-results-entry.md) for scores and sold-out flags (optional, ADR still Proposed): Supabase Auth, RLS write policies, rejects tied placement scores. · later, not in this run

## 9. 2026 schedule (last)

The app has to be ready before this point: teams register first, and the schedule built from the registrations sets the start and end time, the number of halls, groups and teams per class, and the placement structure. Until then, nothing in the app may hard-code any of these. Halls, classes, groups, times and the "Ende" info tile all come from the data, and the app is tested against the 2025 data plus made-up variants (more halls, a Jugend class, a quarterfinal bracket).

- [ ] Load the 2026 teams, groups, halls and schedule (with placeholders for placement games). · **(owner)**
- [ ] Smoke test with the real schedule: every page at phone width, standings and bracket resolve correctly. · `sonnet`
