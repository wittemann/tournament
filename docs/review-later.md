# Review later

What the autonomous run decided, assumed, skipped or deferred, for the owner to look at afterwards. Newest at the bottom of each list. Larger decisions also get an ADR (status **Proposed** until the owner accepts them).

## Decisions made without the owner

- **Section 1 order:** the test runner and check-gate scripts were set up before the dependency update pass, so the update could be verified against the full gate. `npm ci` ran in the main session (no diff to review).

- **ESLint 10 taken** although `eslint-plugin-import`, `eslint-plugin-jsx-a11y` and `eslint-plugin-react` (via `eslint-config-next` 16.4.0) declare peer `eslint` ≤ 9. Clean `npm ci` / `npm install` succeed with peer warnings only, and their rules were checked to fire under ESLint 10. Revert to `^9` if a future install hard-fails.
- **Vitest 5 and `@types/node` 24 taken** beyond the update list: Vitest 5 needs `@types/node` ≥ 22, and Node 24 is what runs locally.
- **Node floor:** isomorphic-dompurify 4 (jsdom 30) needs Node `^22.22.2 || ^24.15.0 || >=26`. The Vercel project's Node setting couldn't be checked (connector has no access to the scope); it must be 24.x (or 22.22.2+). Consider `"engines": { "node": ">=22.22.2" }` in package.json.
- Next 16.4.0 was five days old when taken; pick up 16.4.x patches before the event.
- `npm audit`: 5 high findings remain in `braces`/`micromatch`/`fast-glob` under `@next/eslint-plugin-next` (dev tooling only; the suggested fix would downgrade `eslint-config-next` to 14).

## Assumptions

- npm 11 skips install scripts not covered by `allowScripts` (`sharp`, `unrs-resolver`). Both ship prebuilt binaries, so the build works without them; nothing was approved.

## Skipped items

- TypeScript 7 not taken (stays on 5.9): `npm run lint` crashes with "typescript-eslint does not support TS 7.0" (pulled in by `eslint-config-next` 16.4.0). Revisit when typescript-eslint supports TS 7.

## Deferred review findings

Nice-to-haves from the reviews, and findings left after the review cap. Security findings are only written here once they're fixed (the repo is public).

_None yet._
