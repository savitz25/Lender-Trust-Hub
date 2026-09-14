# TH-SEARCH-R1-015 - NJ lender/roster refusal degrades to a real answer

Builder: Claude Sonnet 5, session `session_01Pc4AGr9JgdKKyZ9VWv1Bth`. Not independent human review;
labeled per the standing contract's honesty requirement.

Starting main: `d1d7dd7abbcdca3d3817bf00a5119dd76df39b87` (PR #35, "ath-metrics-r2-03-lender"),
confirmed as the current `origin/main` HEAD via a fresh `git clone` into an isolated worktree
(`C:/Users/makei/lender-trust-hub-r1-015`) rather than reusing the existing dirty primary
checkout at `C:/Users/makei/lender-trust-hub`, which has unrelated uncommitted FDIC-CSV
import work-in-progress and several locally-deleted tracked files that predate this session
and were left untouched.

## Ground-truth baseline (before any code change)

Reproduced against the unmodified baseline via `scripts/r15-repro-check.mts` calling the real
`executeAskQuery`/`executeLenderAsk` functions directly (not curl, not a mock) -- full output in
`red-before.json`:

| Query | `/ask` (executeAskQuery) | Homepage form target (`executeLenderAsk`, internal fallback) |
|---|---|---|
| "lenders in New Jersey" | `fail_closed` / `nj-rmla-request-only` | `fail_closed` (same reason) |
| "lender in new jersey" | `fail_closed` / `nj-rmla-request-only` | `fail_closed` (same reason) |
| "which lenders in New Jersey" | `fail_closed` / `nj-rmla-request-only` | `fail_closed` (same reason) |
| "mortgage lenders in Texas" | `count`, real answer (524,257) | generic national HMDA snapshot (6,793,253), no TX-specific text |
| "mortgage companies in Florida" | `fail_closed` / needs clarification ("companies" unrecognized) | `count`, real Florida answer (via the FL-specific branch) |

Ground truth for the refusal bar: NJ, TX, and FL all have real acquired HMDA institution/scalar
data (`lib/home-intel/accepted-snapshot.json`, `lib/ask-lender/generated/state.csv.json`).
Verified independently against the raw JSON, not through the executor under test:

```
NJ: applications 316994, originations 177325, denials 55453
TX: applications 943136, originations 524257, denials 178854
FL: applications 922758, originations 489025, denials 192366
snapshotVersion lender-home-intel-snapshot-v2, hmdaOfficialAsOf 2025
```

The refusal for "lenders in New Jersey" was therefore a safe refusal over data we already have
-- a defect under the standing contract's refusal bar, not an EXPECTED_SAFE_LIMITATION.

## Root causes

1. `lib/ask-lender/parse.ts` (the shared parser both `/ask` and the homepage form's GET
   ultimately resolve through) had a hard-coded early gate: any question containing "new
   jersey"/"rmla" plus "licensed"/"lender(s)"/"roster" and not already containing HMDA-action
   language (`hmda`/`application`/`originat`/`denial`/`property`) returned `fail_closed`
   unconditionally, before the normal state-detection and mode-assembly cascade ever ran. The
   cascade already resolves NJ correctly for HMDA-worded phrasing (fixed in R1-003/R1-004); the
   gate simply intercepted the plain, terse phrasing real users type first.
2. `lib/ask-lender/parse.ts`'s scalar-count "unsupported remainder" word list (used to detect an
   unrecognized condition in a plain count question) did not include "companies"/"company" as a
   synonym for "lenders", so "mortgage companies in Florida" left a non-empty remainder and
   `scalar-count.ts` correctly-but-wrongly treated that as an unsupported dimension and refused,
   even though the identical concept phrased as "lenders" already worked.
3. `lib/ask-lender/execute.ts`'s `executeLenderAsk` -- an internal fallback used by
   `executeAskQuery` for non-count/aggregate/entity modes -- only special-cased Florida for
   `mode: 'count'`; any other state-grain count silently fell through to a generic national HMDA
   snapshot with no state-specific label. Traced exhaustively (`grep` across every `.ts`/`.tsx`
   under `app/` and `components/`): no live route or component calls `executeLenderAsk` directly
   or reaches this fallback for `mode: 'count'` today, because `executeAskQuery` resolves
   count/aggregate modes via `executeScalarCount` directly at an earlier branch, and the
   homepage's search form is a plain `<form action="/ask" method="get">` that navigates straight
   to `/ask`, not a client/server call into `executeLenderAsk`. This is therefore a real, latent
   defect in a real exported function (confirmed failing via a direct unit-level call, see
   `red-before.json`'s `surface_home` column) but **not currently observable through any live URL
   for these queries** -- see the "both-surfaces" note below for why this is reported precisely
   rather than rounded up to a live-bug claim.

## Repair

- `parse.ts`: removed the standalone NJ hard block. `parseLenderAsk` is now a thin wrapper around
  the existing cascade (`parseLenderAskCore`, unchanged): if the resolved result is a real,
  executable plan (not already `fail_closed` for some other reason) and its resolved geography is
  NJ and the raw text mentions licensing/lender/roster language, it attaches
  `coverageState: 'REQUEST_ONLY'` to that real result -- never blocks it. The RMLA-roster fact
  itself is preserved verbatim as `NJ_RMLA_COVERAGE_NOTE`, exported once and consumed by both
  `scalar-count.ts` (plain count) and `execute-query.ts` (institution ranking) so the caveat
  renders identically regardless of which real mode the question resolves to.
- `parse.ts`: added "companies"/"company" to the scalar-count noise-word list, matching how
  "lenders?" is already treated there.
- `execute.ts`: widened the existing "hand off to /ask instead of computing locally" condition to
  cover any non-Florida state-grain count, not only county-grain -- closing the latent defect in
  item 3 above even though it is not presently reachable, since it is part of the same exported,
  tested function and the fix is a net simplification (one extra boolean clause) with zero
  behavioral cost to the paths that are reachable.
- The other state-specific "roster not acquired" gates (CA/AZ/CO/VA/NY/IL, `parse.ts` lines
  ~104-146) were deliberately left untouched. They were not ground-truthed against a real
  alternative dataset the way NJ was, and touching them is explicitly out of scope for this
  ticket (see `r15-behavior.test.ts`'s regression fence, which fails first if a future change
  accidentally widens the NJ fix onto them).

## Both-surfaces finding (as required by the R1-015 addendum)

There is exactly **one** entity+geography resolver for these queries in production traffic:
`lib/ask-lender/parse.ts`'s `parseLenderAsk`, consumed by `lib/ask-lender/execute-query.ts`'s
`executeAskQuery`, which both the `/ask` page (`app/ask/page.tsx`) and the `/api/ask` route
(`app/api/ask/route.ts`) call directly, and which the homepage's own search form also reaches --
not via a second parser, but via a plain HTML GET to `/ask` (`components/home-intel/ask-trust-hub-search.tsx`,
`<form action="/ask" method="get">`). Verified live in a real browser (Chrome via
`claude-in-chrome`, not curl): typing "lenders in New Jersey" into the homepage box and clicking
"Research" navigates to `/ask?q=lenders+in+New+Jersey&action=&loanType=&geo=` and renders the
same real answer confirmed directly on `/ask`.

`lib/ask-lender/execute.ts`'s `executeLenderAsk` is a second function that exists in the same
module tree and is exported, tested, and called internally by `executeAskQuery` as a fallback --
but, as traced above, that fallback branch is not reached by any of these queries in the current
routing. It is not a second live "surface" for this ticket's ground-truth queries; it is
dead-for-this-path code with a real latent defect, fixed and regression-tested, reported exactly
that precisely rather than claimed as a live fix.

## Verification

- `npm run check:th-search-r1-015` (new `r15-reproduction.test.ts` + `r15-behavior.test.ts`,
  chained with the existing R1-002/R1-003/R1-004 suites per the established convention): 98/98
  pass. `result.json` / `after-fix.json` record the real, direct-function-call green state.
- `npm test` (full repository suite, ~99+ scripts including Python HMDA/state-intelligence
  checks): PASS, exit 0.
- `npm run typecheck`: PASS, 0 errors.
- `npm run lint`: PASS, 0 errors, 1 pre-existing unrelated warning (`pngSize` in
  `scripts/assert-share-002.mjs`, documented in the R1-002 diagnosis as already existing).
- `npm run build`: PASS.
- Three targeted mutations, each reverted after confirming detection:
  - **A** (reintroduce the NJ hard block): 26 tests failed, including the new R1-015 tests and
    (correctly) the pre-existing R1-004 suite, since its own NJ-worded fixtures now also tripped
    the reintroduced block.
  - **B** (revert the `execute.ts` non-FL-state redirect): exactly the 2 tests that assert that
    specific behavior failed; nothing else.
  - **C** (revert the "companies" synonym): exactly the 2 tests that assert that specific
    behavior failed; nothing else.
- Real browser verification (Chrome via `claude-in-chrome`, local production build,
  `next start -p 3915`, not curl/raw HTML):
  - `/ask?q=lenders%20in%20New%20Jersey` rendered "New Jersey originations: 177,325" with
    "Coverage: REQUEST_ONLY" and the RMLA caveat as the first caveat line. No refusal, no console
    errors of page origin (the only console entries were the well-known
    `chrome-extension://.../next-content.js` messaging noise, unrelated to the page).
  - `/ask?q=which%20lenders%20in%20New%20Jersey` rendered a real, paginated (32 pages, 776 rows)
    institution ranking headed by Rocket Mortgage (12,035 originations), with correct
    public-profile/unpublished/identity-hold labeling and the same RMLA caveat first in the list.
  - The homepage search form, driven end-to-end (click input, type, click Research), correctly
    navigated to `/ask` and rendered the identical real answer.
  - Mobile viewport rendering (390px/320px) was **not verified**: this session's browser
    automation environment does not honor `resize_window` requests below the current window size
    (a known, previously-documented environment limitation, not attempted-and-abandoned here --
    see the note in this same session's separate ATH-METRICS-R2 work). This is reported as NOT
    TESTED rather than assumed passing.

## Copy integrity / dead-end audit (per the R1-015 addendum)

- No unrendered template variables were introduced; `NJ_RMLA_COVERAGE_NOTE` is a static string
  with no interpolation.
- The caveat text is NJ-specific and does not leak onto other states' answers
  (`r15-behavior.test.ts`, "coverage caveat is NJ-specific, never leaks onto other states").
- The remaining state gates (CA/AZ/CO/VA/NY/IL) were not modified; their existing dead-end
  behavior (no explicit next-action link for most of them, per `execute.ts`'s fail_closed
  handler, which only sets an `href` for Florida or `entity-volume`) is unchanged and is out of
  scope for this ticket -- named here for visibility per the addendum's dead-end audit
  requirement, not fixed.

## Scope and rollback

This ticket touches only `lib/ask-lender/parse.ts`, `lib/ask-lender/scalar-count.ts`,
`lib/ask-lender/execute-query.ts`, `lib/ask-lender/execute.ts`, plus new tests and this QA
evidence. No source data, migration, credential, or unrelated-hub file was changed. Rollback is a
normal reviewed revert of this ticket's implementation commit(s) through a new PR; no database
rollback is required.
