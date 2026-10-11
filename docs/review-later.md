# Review later

What the autonomous run decided, assumed, skipped or deferred, for the owner to look at afterwards. Newest at the bottom of each list. Larger decisions also get an ADR (status **Proposed** until the owner accepts them).

## Decisions made without the owner

- **Section 1 order:** the test runner and check-gate scripts were set up before the dependency update pass, so the update could be verified against the full gate. `npm ci` ran in the main session (no diff to review).

## Assumptions

- npm 11 skips install scripts not covered by `allowScripts` (`sharp`, `unrs-resolver`). Both ship prebuilt binaries, so the build works without them; nothing was approved.

## Skipped items

_None yet._

## Deferred review findings

Nice-to-haves from the reviews, and findings left after the review cap. Security findings are only written here once they're fixed (the repo is public).

_None yet._
