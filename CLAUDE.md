# tournament

Live schedule, standings and sales app for the Bretten Kangaroos Xmas-Ball (one event per deployment). German UI; code, identifiers and docs in English ([ADR-0003](docs/adr/0003-single-event-german-ui.md)).

- **Stack:** Next.js, Supabase (Realtime reads), Tailwind + daisyUI ([ADR-0002](docs/adr/0002-tech-stack.md)). Deployed on Vercel from `main`.
- **Docs:** [docs/README.md](docs/README.md). Task list: [docs/TODO.md](docs/TODO.md). Design: [docs/design/](docs/design/README.md), light mode only, phone column.
- **Schema** lives in `supabase/migrations/` ([ADR-0005](docs/adr/0005-schema-as-migrations.md)). No local Supabase stack on this machine: migrations are applied to the live project via the Supabase MCP. The 2025 data is backed up in `supabase/seed.sql`.

## How we work

The full workflow (sub-agents, model tags, review loop, cap, commits) is in [docs/TODO.md](docs/TODO.md), "How we work". In short:

- Every item is built by a sub-agent on the model its tag names, then reviewed by a read-only sub-agent on another model (code, architecture, security). Findings go back to development until clean, capped at 3 rounds.
- No human review in this run. Decisions, assumptions, skipped items and deferred findings go to [docs/review-later.md](docs/review-later.md); larger decisions get an ADR with status **Proposed**.
- Only as much code as the item needs. No drive-by refactors.
- Check gate before every commit: `npm run format:check`, `lint`, `typecheck`, `test`, `build`. Visual changes checked in the browser pane at 360–430 px.
- Small commits on `main`, Conventional Commits (`type(scope): subject`, imperative, lowercase; body says why). The commit that completes an item ticks it off. Push when a section is done.
- Parallel work only when clearly safe (disjoint files, separate worktrees); in doubt, sequential.
- Before relying on a library API, check the current docs.
- **Public repo:** never commit secrets or `.env*`. Write security findings down only once they're fixed.
