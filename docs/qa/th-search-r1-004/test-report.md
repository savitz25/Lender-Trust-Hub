# TH-SEARCH-R1-004 observed validation

The unchanged baseline fails the numeric-denominator regression (red-before.log). A real Production homepage browser submission also shows the false-zero result (baseline-browser.json and screenshot). These are observed failures, not simulated verdicts.

The focused suite currently passes 26 executable tests covering source capability, strict selected-value validation, valid zeroes, incomplete cohorts, secondary nulls, disjoint FL aggregation, duplicate/mixed-vintage rejection, pagination independence, source-derived Trace, overrides, unsupported dimensions, scalar recovery, actual page/API parity, source errors and protected identity/scalar/comparison behavior. Expected sums are selected directly from raw files or independently specified fixtures, never from the production selector.

Mutations were applied one at a time to the real selector: unavailable-to-zero conversion and ignored product. Each made the focused suite fail. Original bytes were restored and the clean gate rerun. See mutations.json and mutation logs. No mutations or synthetic source rows entered Production.

R1-002: 24 PASS. R1-003: 26 PASS. Full npm test chain PASS. Search001c PASS. Capability001: 73 PASS; capability002: 40 PASS; customer: 6 PASS. Typecheck PASS on the prior implementation iteration; final build/typecheck/lint repeat in progress. Lint: zero errors, one pre-existing pngSize warning, reproduced on the exact isolated baseline.

The initial regression run caught token-boundary handling for conventional mortgages, omitted geography labels, and an existing wording assertion. These were repaired, not relabeled baseline failures. Purchase-purpose parser assertions were updated because the same unsupported condition now reaches the shared capability boundary with its original state/action intact; no unsupported purpose table was enabled.

Candidate and final Production browser evidence are pending. Build success alone is not a release or browser certification. Final review, PR checks, deployment identity, browser timing and remaining limitations will be recorded after execution.

## Exact candidate validation

Implementation commit f41e4cb8b8abe8ed4298190ac9182903fec26211: final production build and standalone typecheck PASS. Lint has zero errors and the one exact-baseline warning. Focused gate 26/26 PASS. Full npm tests and all listed supplementary gates PASS.

Real persistent Chrome against the optimized local production build: 13 representative cases PASS, maximum initial completion 1,113ms. Homepage first interaction/Enter, native/API value and availability, query Trace keyboard activation, filter available/unavailable transitions, scalar recovery, refresh, back/forward, edit/Enter and preserved typed overrides PASS. 1280/390/320 overflow checks PASS; screenshots reviewed visually. The runner initially inspected the pre-navigation URL after clicking recovery; it was corrected to await the destination URL, then rerun successfully. This is a test-harness correction, not an application bypass.

Preview deployment dpl_6R2Ercv4wYgTF4VGjTEgGbUWk4RS built the exact candidate. Browser navigation reaches Vercel SSO login; protected preview UI was not tested. Protection remains intact. Local optimized-build browser proof and eventual canonical Production proof are separate from preview build success.

Review: a separate self-review found and fixed a county recovery URL that could have overridden Orange County to Florida; the added test proves county scope survives. Existing automated Vercel Agent Review remains pending. This is not independent human review. Secret-pattern scans of the ticket changes, QA artifacts and client chunks found no key/private-key matches; no credentials were needed or changed.

## Canonical Production proof

PR #31 merged normally at 2026-09-11T21:07:06Z as 870532c7d083a733f4f689fab7b68a434ad04628. Implementation f41e4cb was separately self-reviewed and passed Vercel Agent Review at 21:05:56Z with no inline findings. PR head fc3b19e adds evidence and browser synchronization; both preview builds and CI passed before merge.

Canonical www.lendertrusthub.com was verified READY on dpl_EeH66to9CF2h2zuXkGFiRaqFPZxe with exact merge SHA. The real Production browser suite passes all 13 cases, maximum initial completion 4,623ms. Native/API availability and source fingerprints agree; supported numeric tables, unsupported breakdowns, scalar recovery, NMLS positive/miss and comparison remain correct. Keyboard first interaction, filters, Trace, refresh, history, query edits and 1280/390/320 overflow checks pass. Production screenshots and the full machine-readable observations are retained.

Ten route smoke checks pass (home, Ask, published Rocket profile, FL/NJ state surfaces, calculators, comparison, admin sign-in, robots and sitemap). Bare-host 308 redirects to www and preserves the question. Vercel error/fatal logs grouped by route returned zero rows for this deployment since 21:09:00Z.

Observed current source controls: NJ institution denials remain explicitly unavailable in the selected state-LEI runtime file; scalar recovery returns the independently sourced 55,453. NJ institution originations sum to 177,325; FL FHA originations 86,736; Broward institution applications 67,620; FL county-derived institution denials 192,366. These are pinned-source observations, not hardcoded product values. The distinct Broward scalar/comparison application aggregate remains 67,743 under its existing source contract.

TH-SEARCH-R1-004 is released and verified. A documentation/QA-only follow-up will record this evidence; its future SHA is deliberately not invented here. No database rollback is needed: rollback is a normal reviewed revert/deployment of this ticket's runtime changes only.
