# TH-SEARCH-R1-004 diagnosis and source contract

Builder: GPT-6 Astra / High, USER-CONFIRMED; active-session metadata is not independently exposed.

Baseline: `0f933f78bb118d4f146e3f0b4c9081416f0a4400`. Remote verified as savitz25/Lender-Trust-Hub. Fresh origin/main matched handoff. No R1-004 branch/worktree, open PR, or matching locally visible node/codex task process was found. This is a bounded ownership check, not proof that no other session exists. Existing dirty primary checkout and closed R1-002/R1-003 worktrees were preserved. New worktree: `th-search-r1-004-work`.

## Reproduction

Canonical deployment `dpl_82axUiEbZY7PrUBjGXrWpU8sovz4` served the baseline SHA. A real 390px homepage Enter submission of ?Which lenders reported the most mortgage denials in New Jersey?? settled in 4,487ms and displayed a numeric `New Jersey denials: 0` denominator. API rows and totalRows were zero; Trace claimed a state-file denial sort. See baseline-browser.json/png. The same assertion failed against the untouched baseline executor; red-before.log records the actual failure.

`metricFromState` returns null for missing denials and product applications. `metricFromCounty` returns zero for product denials. Ranking filters discard these before the result builder reduces the empty set to zero. The catalog's generic numeric conversion also erased missing/blank values; county aggregation did not itself enforce FL state. Institution parser returns dropped year, purpose and scope limitations. None of this establishes that no institutions or mortgage activity existed.

## Repair boundary

Keep `executeAskQuery` authoritative. A local institution-volume selector reads the same bounded committed raw catalogs before their legacy numeric coercion, validates capability, keys, vintage, selected numeric fields and partition, then groups by exact LEI and orders positive values. It returns additive `volumeEvidence`; it does not replace identity enrichment or the scalar engine. Comparisons retain their current executor. Missing selected values reject complete ranking; missing secondary values stay null. Unavailable responses omit numeric population/denominator facts. Available sums are labeled observed sums within the acquired cohort, not statistical denominators. The local specialist-v2 adapter propagates unavailable/clarification/backend states instead of declaring zero matching rows.

Purpose requests now reach the institution capability decision with their geography/action intact, instead of the old parser-only fail_closed branch (which could discard non-FL state). The existing purchase assertion was updated to require preserved purpose plus UNSUPPORTED execution; no purchase table was enabled. Phrase removal now uses token boundaries so ?conventional mortgages? does not leave a spurious plural suffix. Multi-product/purpose requests remain distinct and require clarification/unsupported resolution.

## Source / measure matrix

All counts below are independent raw-file sums for the pinned baseline, not permanent constants. `source-oracle.json` records raw byte hashes, schema, row counts, years, states and duplicate-key inspection. Runtime fingerprints use SHA256(JSON.stringify(source)); this differs from raw-file hashing because whitespace/line endings differ.

| Source | Native grain / coverage | Available measures | Missing dimensions | Aggregation |
|---|---|---|---|---|
| generated/state.csv.json, from national/lender_state_summary.csv | 2025 state/LEI; 36,402 unique rows, 54 acquired jurisdictions | total_applications, total_originations; orig_conventional/fha/va/usda_other/other_loan_type | denial, product applications, purpose counts | state selection; national grouping across disjoint acquired state partitions, explicitly limited to this file |
| generated/county.csv.json, from FL/lender_activity_by_county.csv | 2025 FL county/LEI; 22,359 unique rows | applications, originations, denials; apps_* and orig_* products | product denial, purpose | one supported FL county; disjoint FL counties grouped by LEI only for the existing compatible state alternative |
| generated/markets.csv.json | 2025 FL county aggregate; 67 rows | separate market aggregates and application-purpose fields | not institution attribution | protected scalar/comparison reference only; never institution rows |
| accepted-snapshot.json | HMDA 2025 county-derived jurisdiction aggregates | applications/originations/denials | institution contribution | protected R1-003 scalar recovery only |

State-file NJ applications sum to 318,280 and originations to 177,325; denials are absent. FL state-file originations sum to 489,025 and FHA originations to 86,736. FL county-file denials sum to 192,366. NJ scalar aggregate denials are 55,453. Different acquired universes may have different application totals; no totals were forced into agreement.

`process_hmda.py` and `process_hmda_national.py` map HMDA loan_type code 4 alone to *_usda_other; unknown codes go to *_other_loan_type. Thus the legacy field name does not combine unknown codes in these artifacts. No new product semantics or source data were introduced.

Raw institution artifacts carry year in every observation but no retrieval/generation timestamp; those clocks remain null. Snapshot clocks remain exclusively on scalar evidence. Completeness is validated within the acquired file, not claimed for all U.S. institutions/activity. Exact source keys, finite nonnegative safe integers, unique single vintage and no state/county overlap are checked before selected-field filtering/sums. Missing/empty/corrupt artifacts are unavailable.

## Compatibility and safety

Read-only inspection of Ask's lender-ask-v1 consumer found optional denominator/rows/facts and failClosed handling; new evidence is additive. Unavailable rows=[] is transport only, with no totalRows, population or observed-sum assertion. Specialist v2 retains its numeric total=0 transport convention only alongside explicit UNSUPPORTED_CAPABILITY/CLARIFICATION_REQUIRED/BACKEND_UNAVAILABLE state; it must not become ZERO_MATCHING_ROWS. No other repository was changed.

No source data, schema, publication, credentials, environment, paid resources or approval controls were changed. Identity/publication enrichment remains downstream of volume selection and cannot alter cohort totals. No raw-query analytics were added.

## Review and release method

Separate self-review of the final diff plus existing automated CI/Vercel Agent Review; not independent human review. Release uses a normal scoped PR and merge after checks. Preview browser access will be attempted without weakening protection. Exact local production-build browser proof and final canonical Production browser proof are recorded separately. Rollback is a reviewed revert of this ticket's implementation and normal redeployment; no database rollback and no revert of R1-002/R1-003.

Only R1-004 institution measure availability is eligible for closure. Broader name/licensing, geography/discovery, comparisons, rates/shares, parent Ask/Senior routing and Search Reliability R1 remain outside this ticket.
