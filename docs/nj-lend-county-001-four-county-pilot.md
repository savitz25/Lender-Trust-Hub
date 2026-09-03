# NJ-LEND-COUNTY-001 — Monmouth, Middlesex, Somerset, Union

Four county mortgage and property-market research pages on LenderTrustHub, built from the NJ-LEND-003 state snapshot plus already-audited AskTrustHub county research.

Ask research SHA (read-only): `f0407c3c659886ba46522a4e023989c1641cab7d`. AskTrustHub was not modified.

## Routes

- `/new-jersey/monmouth-county`
- `/new-jersey/middlesex-county`
- `/new-jersey/somerset-county`
- `/new-jersey/union-county`

No municipality pages.

## Snapshots

Deterministic accepted snapshots:

- `lib/new-jersey-intelligence/counties/monmouth.json`
- `lib/new-jersey-intelligence/counties/middlesex.json`
- `lib/new-jersey-intelligence/counties/somerset.json`
- `lib/new-jersey-intelligence/counties/union.json`

HMDA rows are copied from the committed 2025 New Jersey county slice. NJHMFA DPA geography is reused from NJ-LEND-003 (all four counties are in the 12-county group). Land-record, sheriff, and parcel facts come from the Ask county research fixtures, not a new scrape.

## Publication gate

Each published county has at least three authoritative source families, one county-specific research source, two stored findings, and a fingerprint. Pages that fail the gate stay noindex.

## Semantics preserved

HMDA is not a license roster. Denial rate is not quality. Sheriff schedule is not completed foreclosure. Mortgage recording is not current balance. Assessment is not appraisal. Parcel count is not household count. NJHMFA participation is not endorsement. DPA county is not borrower eligibility. County data absence is not zero.
