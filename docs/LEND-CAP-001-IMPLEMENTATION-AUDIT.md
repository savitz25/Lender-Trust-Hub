# LEND-CAP-001 implementation audit

Audit date: 2026-09-01  
Accepted source: `3f859953bd6962ff85db26735a3b93f47904c270`  
Production: `dpl_2qWBhtTHM6R1iJ2NQjz8SNpn7zKt` (`READY`)  
Existing contract: `lender-ask-v1`

## Existing execution path

`GET /api/ask` calls `executeAskQuery`, which parses with `parseLenderAsk`, loads the
committed HMDA catalog, selects county/state LEI rows, applies action and loan-type
columns, resolves the accepted LEI identity bridge, applies the public-profile gate,
sorts by the disclosed raw metric, and returns bounded rows and trace metadata.

The V2 work therefore needs a validated structured-input adapter, not another HMDA
query engine. Structured V2 requests will pass a `LenderResearchQuery` into the same
`executeAskQuery` execution path. V1 continues to parse its existing natural-language
contract and retains its 25-row default.

## Production observations before implementation

- FHA lenders in Broward County: V1 aggregate/count response; the canonical entity
  form already returns 214 LEI-grain rows.
- Palm Beach originations: V1 aggregate/count response; entity rows already exist at
  county FIPS `12099`.
- Florida loan-type cohorts: source-backed through committed state/county catalogs.
- `lenders in Texas`: fail-closed because “in” does not establish property-market,
  headquarters, branch, license, or service-territory meaning.
- exact NMLS and LEI: fail-closed; this remains LEND-CAP-002.
- named Rocket Mortgage complaint request: V1 returns general CFPB coverage, not an
  exact identity-bound result; V2 must mark it unsupported.
- “best mortgage lender”: ranking refusal.

## Source and grain

The primary market source is the committed HMDA 2025 reporting vintage. Cohort rows
are reporting institutions identified by LEI crossed with one selected property
geography, action, and optional loan type. County rows currently come from the
accepted Florida county catalog; state rows cover the states present in the committed
state catalog. State and county populations are never added together.

## Publication inventory semantics

- Canonical institution inventory: 14,623 in the accepted intelligence snapshot.
- HMDA LEIs: research identities keyed by exact LEI; not profile inventory.
- National renderable profiles: 181.
- National indexable profiles: 180.
- Florida public state-profile rows: 130.
- HMDA rows without a public destination remain research rows.
- Identity conflicts remain `identity_hold` and receive no public link.

No stale count is used as a V2 provenance claim. No publication rule changes are
authorized by this adapter.

## Safety decision

DB writes, identity writes, profile creation, branch/MLO publication, sitemap changes,
and AskTrustHub changes are all out of scope and expected to remain zero.
