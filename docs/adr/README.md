# Architecture Decision Records

This folder records the significant decisions behind the Xmas-Ball tournament app: what was decided, why, and what else was considered.

## Index

| ADR | Title | Status |
|-----|-------|--------|
| [0001](0001-evolve-existing-codebase.md) | Evolve the existing codebase instead of rewriting | Accepted |
| [0002](0002-tech-stack.md) | Next.js, Supabase, Tailwind and daisyUI | Accepted |
| [0003](0003-single-event-german-ui.md) | One event per deployment, German-only UI | Accepted |
| [0004](0004-client-side-realtime-reads.md) | Public client-side reads with Supabase Realtime | Accepted |
| [0005](0005-schema-as-migrations.md) | Database schema lives in the repo as migrations | Accepted |
| [0006](0006-computed-standings.md) | Standings are computed from game results | Accepted |
| [0007](0007-admin-results-entry.md) | Results entry through an admin page | Rejected |
| [0008](0008-faq-sanitized-html.md) | FAQ answers stored as sanitized HTML | Accepted |

## Writing a new ADR

1. Copy [template.md](template.md) to `NNNN-short-title.md` with the next number.
2. Start with status **Proposed**. Change it to **Accepted** once decided.
3. Never rewrite an accepted ADR to change the decision. Write a new one and mark the old one **Superseded by ADR-NNNN**.
4. Add it to the index above.

ADRs dated 2026-10-10 that describe choices from the first version (November 2025) were recorded after the fact. They say so in their context section.
