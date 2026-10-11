# tournament

Live schedule, standings and sales app for the Bretten Kangaroos Xmas-Ball. The UI is German. One event per deployment ([ADR-0003](docs/adr/0003-single-event-german-ui.md)).

- Docs: [docs/README.md](docs/README.md)
- Open tasks for the 2026 edition: [docs/TODO.md](docs/TODO.md)

Stack: Next.js, React, TypeScript, Supabase (Postgres + Realtime), Tailwind CSS and daisyUI ([ADR-0002](docs/adr/0002-tech-stack.md)).

## Setup

Use Node 24 (matches `@types/node`).

```bash
npm ci
cp .env.example .env.local
# fill in the values, see below
npm run dev
```

The app runs at http://localhost:3000. There is no local Supabase stack: `.env.local` points at the live project (read-only with the public key).

## Environment variables

Set them in `.env.local` locally and in the Vercel project settings for deploys. Never commit `.env*` files except `.env.example`.

| Variable                        | Where to find it                                                                       |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase dashboard → Project Settings → API → Project URL                              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Project Settings → API → anon / publishable key (safe for public) |
| `NEXT_PUBLIC_SENTRY_DSN`        | Sentry → project tournament → Settings → Client Keys (DSN); empty disables Sentry      |
| `SENTRY_AUTH_TOKEN` (optional)  | Sentry auth token, build-time only, for source map upload; never commit                |

The key is public by design. Row Level Security only allows reads with it ([ADR-0004](docs/adr/0004-client-side-realtime-reads.md)).

## Scripts

| Script                 | What it does                    |
| ---------------------- | ------------------------------- |
| `npm run dev`          | Start the dev server            |
| `npm run build`        | Production build                |
| `npm start`            | Serve the production build      |
| `npm run lint`         | ESLint                          |
| `npm run format`       | Format everything with Prettier |
| `npm run format:check` | Check formatting                |
| `npm run typecheck`    | `tsc --noEmit`                  |
| `npm test`             | Run the tests once (Vitest)     |
| `npm run test:watch`   | Tests in watch mode             |

Check gate: before every commit, `format:check`, `lint`, `typecheck`, `test` and `build` must all pass.

## Database

- The schema, RLS policies and Realtime settings live in `supabase/migrations/` ([ADR-0005](docs/adr/0005-schema-as-migrations.md)). Schema changes always go through a new migration, never through the dashboard alone.
- After a schema change, regenerate `lib/database.types.ts` (Supabase MCP `generate_typescript_types`, or `supabase gen types typescript --project-id bylkrfekrtbbsubhdbfb`).
- The 2025 tournament data is backed up in `supabase/seed.sql`.
- Apply migrations to the live project with the Supabase MCP (`apply_migration`). It records its own timestamp as the version, so afterwards check `list_migrations` and rename the repo file to that version, so repo and history match. (Alternative: `supabase db push`.)
- The baseline migration `20251120000000` is recorded as applied in the live project's migration history (TODO section 1), so it is never run again.

## Deploy

Vercel deploys from `main`. Every push to `main` goes to production.

## Pre-event runbook

Do this a few weeks before the event.

1. Restore the Supabase project. The free tier pauses idle projects. Wait until the restore has fully finished, which takes several minutes. The database can look empty before that ([ADR-0002](docs/adr/0002-tech-stack.md)). Then check in the table editor that `games` and `items` have rows.
2. Apply pending migrations (see Database).
3. Load the year's data in the Supabase table editor or with SQL: teams and halls (once those tables exist, TODO section 2), games (with placeholders for placement games) and the sales items.
4. Reset the sold-out flags on the items.
5. Update the FAQ links (rules, directions) to this year's PDFs.
6. Invite helpers to the Supabase organization (Organization Settings → Team). This gives them access to the whole project, which is why [ADR-0007](docs/adr/0007-admin-results-entry.md) proposes an admin page. Until it is built, results are entered in the table editor.
7. Run a dependency security update pass (`npm outdated`, `npm audit`), especially Next.js and React. Run the check gate, then push.
8. Check the live site on a phone: schedule, standings, sales and FAQ, and that a changed result shows up without reloading.

### After the event

Export the year's data into the repo. Keep the 2025 data in `supabase/seed.sql`: it is the reference case for the standings tests ([ADR-0005](docs/adr/0005-schema-as-migrations.md), [ADR-0006](docs/adr/0006-computed-standings.md)).
