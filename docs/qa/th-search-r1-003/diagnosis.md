# TH-SEARCH-R1-003 diagnosis (before repair)

Builder: GPT-6 Astra / High, USER-CONFIRMED. Baseline: 3015d1b16f239f5eb6e662675b760b3fb51907b8. Isolated branch th-search-r1-003; no production data changes.

The native page and API already share executeAskQuery. Its scalar snapshot dispatch reparses raw input through executeLenderAsk, losing typed overrides. executeLenderAsk selects a state scalar only for FL; NJ falls into national metrics. The national selection treats denial as applications. The parser only recognizes a subset of state names, omits scalar purpose/lender-type conditions, and does not retain explicit years. Filter chips retain only FL/county geography. These combine correct-looking interpretation with a different executed value.

Two behavioral regressions fail on unchanged runtime baseline: NJ originations expected the independently selected accepted NJ field, but received national originations; NJ text overridden to FL/denial also received national originations. baseline-browser.json records actual settled production UI/API before repair.

## Measure/source matrix

| Source | Native grain | Supported scalar measures | Limitations |
|---|---|---|---|
| lib/home-intel/accepted-snapshot.json | Accepted county observations aggregated by jurisdiction; separate national aggregate | applications, originations, denials | HMDA 2025 only; no product/purpose split. Select one unique state key, never sum state and county rows. |
| lib/ask-lender/generated/state.csv.json | year/state/LEI | applications and originations; origination loan-type fields | No denial field, no loan-type applications. Separate state-grain universe; do not force agreement with county aggregate. |
| lib/ask-lender/generated/county.csv.json | year/FL county/LEI | applications, originations, denials; application/origination loan-type splits | FL only; no denial loan-type split. |
| lib/ask-lender/generated/markets.csv.json | year/FL county market | applications, originations, denials; purchase/refinance applications; product applications/originations | No purpose originations or product denials; do not substitute unfiltered totals. |

Independent Python JSON selection and SHA-256 are in source-oracle.json. It reads the artifact directly, without importing the production executor. No dates or totals are hand-edited. Reporting year is 2025, retrieval date 2026-08-30, generation timestamp 2026-08-30T16:22:07.696760+00:00. None is a live verification time.

Implementation: retain the existing executeAskQuery boundary, execute its validated scalar plan directly, use validated accepted aggregates first, and use raw catalog fields only for supported filtered dimensions. Add source/measure/value metadata and derive labels/Trace from that result. Preserve identity, table, comparison, publication and account paths.
