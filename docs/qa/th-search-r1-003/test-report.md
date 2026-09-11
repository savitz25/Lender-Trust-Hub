# Observed certification

## Before / after

At baseline 3015d1b, the real NJ origination browser/API result used 6,793,253 (national) under state NJ. The independent source selector found geography[state=NJ].originations = 177,325. The separate denial control selected the national applications field before repair. Two executable regressions failed on unchanged runtime source before implementation; red-before.txt preserves actual expected/observed assertions.

Core candidate 1a2ee72 passes 25 focused tests, including all recognized fixture jurisdictions and every accepted-source jurisdiction for applications/originations/denials. R1-002 passes 24 tests. npm test, check:th-search-001c, both capability checks and six customer/handoff checks pass. Typecheck and production build pass. Full lint: zero errors, one unchanged scripts/assert-share-002.mjs pngSize warning; changed files lint clean. Existing middleware/themeColor and workspace-root build warnings were not suppressed.

Both deliberate mutations failed: national fallback and ignored state/action overrides. Original bytes restored, clean focused tests rerun. Tests use independent fixture values and direct source selection, not prefilled PASS labels. Synthetic fixtures never enter production data.

## Browser

Persistent ordinary Chrome via CDP; local optimized production server, not response-HTML-only verification. Final candidate: 14 browser/API cases passed, maximum 782 ms, 1280/390/320 widths, first homepage interaction/Enter, actual rendered numeric facts, Trace, filter changes, reload/back/forward and no overflow. Screenshots inspected. Native page/API also compared under a shared fixture through their actual entry functions.

Normal Vercel preview access redirects to /login in the available browser. No preview protection was weakened or bypassed. Both preview builds and CI passed. Canonical production checks are recorded separately after deployment; a local build is not described as production proof.

## Coverage and limits

Unfiltered counts use the unique accepted state aggregate or the separate national aggregate, never the current page/publication cohort. Loan-type originations use state-LEI fields; Florida application splits use county-LEI fields. County/purpose requests use acquired Florida county-market fields where supported. These universes are not forced to equal the county-derived accepted aggregate. Null/missing/invalid/duplicate/mixed-vintage input produces no numeric answer; a sourced zero succeeds.

Only existing generic edit/refinement routes were used for count follow-through. No state intelligence URL or official regulator deep link was invented. Existing NMLS/LEI official actions remain unchanged. Search noindex/robots/sitemap protections remain tested.

Review method: separate builder diff review plus successful automated Vercel Agent Review, zero inline findings. Not independent human review. Parent Ask adapter inspected read-only: existing lender-ask-v1 fields retained, countEvidence additive. Scalar adapter omissions/refusal lifting found during review were fixed and regression-tested before merge.

Broader lender discovery, licensing, institution-table measure availability, general comparisons, other local geography, parent completion and the Senior-to-Move misroute remain outside this closure. No paid services, source ingestion, schema/data writes, credential changes, or cross-repository edits.

## Production release

PR #27 merged normally as 116d581487622131648c50d49cb6e29948332645 after CI, both preview builds and Vercel Agent Review succeeded, with zero inline findings. Deployment dpl_A4r8MdJvpZsLtqEy6snfT5J2o2ch is READY and owns www.lendertrusthub.com and lendertrusthub.com. The merge tree matches tested implementation head 1a2ee72 for runtime files.

Actual production persistent-browser suite: 14/14 passed, maximum completion 5,444 ms. NJ applications 316,994; originations 177,325; denials 55,453. These are this accepted source's observations, not permanent constants or live official assertions. Florida/California/national controls, unsupported year/product, NMLS grouped regressions, county comparison and typed state/action changes passed. Ten additional public/account-entry/calculator/profile/state/robots/sitemap route smokes passed. Bare host redirects to canonical www and preserves the full query.

The production source fingerprint matches independent SHA-256(JSON.stringify(accepted snapshot)): 913061d5da375f0a46ba28377a3216c8650aaab86c95b91db0d67821cfa0d008. No error/fatal runtime log rows were returned for this deployment since 2026-09-11T20:03:00Z. No new credential patterns in 73 local client bundles or changed runtime/evidence files. There were no production data writes.

This evidence follow-up may advance main after the certified implementation deployment. It does not invent that future SHA. Final operational proof for any later evidence-only deployment is reported after it exists. Rollback: normal reviewed revert/deployment of PR #27 only; no database rollback, no Move revert.

## Final scalar interpretation certification

A final visual review identified the generic institution-grain interpretation label on otherwise correct scalar counts. PR #29 fixes that label to show counted observations and actual source/output grains. The new regression fails on the prior source and passes after correction. Focused gate: 26/26; R1-002: 24/24; full npm test, changed-file lint and production build pass. The strengthened browser gate verifies the counted-observation label explicitly.

Final runtime candidate df212b512261ab9c92a19c397238a0cc0b5ef4f3 merged as eac8d856c1fb5af04d24966763c0fe96d7cc3e14 after CI, both Vercel builds and automated review passed with zero inline findings. Canonical deployment dpl_6kULLtkcMT6pwkJ2ULvfs6Aqv7Cq passed all 14 real browser/API cases (maximum 4,365 ms) and ten route smokes. NJ values and source fingerprint are unchanged. final-runtime-browser.json and screenshots show the corrected interpretation, count, and Trace together. No error/fatal runtime log rows returned since 2026-09-11T20:19:00Z.

This is the final runtime certification and supersedes the earlier generic interpretation label. A subsequent evidence-only main/deployment may differ in SHA; its runtime tree must remain identical and its final bounded smoke is recorded after it exists. Only TH-SEARCH-R1-003 is closed.
