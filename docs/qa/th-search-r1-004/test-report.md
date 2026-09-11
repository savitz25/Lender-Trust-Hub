# TH-SEARCH-R1-004 observed validation

The unchanged baseline fails the numeric-denominator regression (red-before.log). A real Production homepage browser submission also shows the false-zero result (baseline-browser.json and screenshot). These are observed failures, not simulated verdicts.

The focused suite currently passes 26 executable tests covering source capability, strict selected-value validation, valid zeroes, incomplete cohorts, secondary nulls, disjoint FL aggregation, duplicate/mixed-vintage rejection, pagination independence, source-derived Trace, overrides, unsupported dimensions, scalar recovery, actual page/API parity, source errors and protected identity/scalar/comparison behavior. Expected sums are selected directly from raw files or independently specified fixtures, never from the production selector.

Mutations were applied one at a time to the real selector: unavailable-to-zero conversion and ignored product. Each made the focused suite fail. Original bytes were restored and the clean gate rerun. See mutations.json and mutation logs. No mutations or synthetic source rows entered Production.

R1-002: 24 PASS. R1-003: 26 PASS. Full npm test chain PASS. Search001c PASS. Capability001: 73 PASS; capability002: 40 PASS; customer: 6 PASS. Typecheck PASS on the prior implementation iteration; final build/typecheck/lint repeat in progress. Lint: zero errors, one pre-existing pngSize warning, reproduced on the exact isolated baseline.

The initial regression run caught token-boundary handling for conventional mortgages, omitted geography labels, and an existing wording assertion. These were repaired, not relabeled baseline failures. Purchase-purpose parser assertions were updated because the same unsupported condition now reaches the shared capability boundary with its original state/action intact; no unsupported purpose table was enabled.

Candidate and final Production browser evidence are pending. Build success alone is not a release or browser certification. Final review, PR checks, deployment identity, browser timing and remaining limitations will be recorded after execution.
