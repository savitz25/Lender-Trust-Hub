# Ask specialist execution V2 — LenderTrustHub

Endpoint: `GET|POST /api/specialist-execution/v2`
Contract: `trusthub-specialist-execution-v2`
Version: `2.1.0`
Schema fingerprint: `0da572d08450e68f4f01a4f4b28e2e813503f50b1a84546a29d7eb817db205dd`
Contract fingerprint: `66d47651fc92ddec9866f7b37a36f67f0b9261daba27652f6753ce0d05ec3321`

The endpoint normalizes the accepted `lender-ask-v1` HMDA executor, canonical
exact-identifier graph, and committed curated CFPB aggregate snapshot. It adds
no fuzzy resolver, profile, branch route, MLO route, or publication rule.

## Requests

GET accepts a research question in `q`, with optional bounded `page` and
`limit`. POST accepts the structured request fields below.

```json
{
  "contract": "trusthub-specialist-execution-v2",
  "queryType": "identifier | identity | evidence | market_cohort",
  "entityClass": "hmda_reporting_institution",
  "identifier": { "type": "NMLS | LEI", "value": "3030" },
  "identityName": "Rocket Mortgage",
  "requestedEvidence": ["CFPB_COMPLAINTS"],
  "page": 1,
  "limit": 25
}
```

HMDA requests retain the V2.0 shape: `geography.intent=PROPERTY_MARKET`, a
supported state or Florida county/FIPS, action, optional loan type, and bounded
pagination (maximum 50). Exact identifiers require an explicit NMLS or LEI
label. Bare digits are not guessed.

## Response and result states

Responses contain `queryInterpretation`, `appliedFilters`, `resultState`,
`identity`, `evidenceState`, bounded `rows`, `total`, `pagination`,
`availableRefinements`, `provenance`, `limitations`, publication-safe
`destinations`, and `diagnostics`.

States are `EXACT_IDENTITY`, `NO_CONFIDENT_MATCH`, `AMBIGUOUS_IDENTITIES`,
`IDENTITY_COLLISION`, `SUPPORTED_RESULTS`, `ZERO_MATCHING_ROWS`,
`CLARIFICATION_REQUIRED`, `UNSUPPORTED_CAPABILITY`, `PUBLICATION_RESTRICTED`,
`INVALID_QUERY`, `BACKEND_UNAVAILABLE`, and `TIMEOUT`.

Supported results, supported zero, exact identity, and exact no-match use HTTP
200. Invalid input uses 400. Semantic restrictions, ambiguity, and cross-class
collisions use 422. Backend unavailable uses 503; normalized timeout uses 504.
Identity and evidence remain separate dimensions.

## Identifier and publication semantics

- Institution, branch, and person NMLS are separate exact namespaces.
- Branch and person/MLO identifiers return `PUBLICATION_RESTRICTED`; neither is
  substituted with an institution. Person names and contacts are not returned.
- Cross-namespace NMLS values return `IDENTITY_COLLISION`.
- LEI is the HMDA reporting identity and resolves only through the accepted
  exact bridge. Name-only LEI resolution is prohibited.
- A valid no-match does not become a fuzzy name result or HMDA cohort.
- An exact institution can remain an unpublished research identity.

Destination types are `PUBLIC_LENDER_PROFILE`, `FLORIDA_STATE_PROFILE`,
`OFFICIAL_IDENTIFIER_VERIFICATION`, `RESEARCH_IDENTITY_ONLY`, and
`NO_PUBLIC_DESTINATION`. Null is legitimate. No route is minted.

## Named CFPB evidence

Named execution requires an exact accepted lender identity, then a
source-controlled `curated-exact` or `curated-dba` bridge, then the exact CFPB
company-label aggregate. Affiliate, multi-lineage, unattached, fuzzy, and typo
matches are excluded.

The committed artifact contains aggregates, not raw narratives. Rows may expose
company label, Mortgage product, counts, issue/response buckets, timeliness,
source fetch date, and bridge method. Private consumer information and complaint
narratives are not exposed.

Every named response explains that complaints are consumer-submitted evidence,
not findings of wrongdoing; raw counts are not size-adjusted quality scores;
zero attached rows is not a clean record; affiliate exclusions and reporting
lag apply; and complaint evidence is not a ranking or recommendation.

CFPB snapshot generated: `2026-08-10T00:08:37.996Z`. Recent window starts:
`2024-08-10`. Deployment time is not source freshness.

## HMDA compatibility

HMDA rows remain 2025 reporting-institution LEI rows crossed with property
geography, action, and optional loan type. Property geography is not HQ, branch,
licensing, or service territory. Raw activity is not quality. State and county
grains are not added, and `lender-ask-v1` remains operational.

## Examples

- `NMLS 3030` → exact Rocket identity and existing profile.
- `NMLS 170008` → person-grain publication restriction, no person data.
- `LEI 549300FGXN1K3HLB1R50` → exact identity and exact NMLS bridge.
- `complaints about Rocket Mortgage` → exact identity plus one exact CFPB
  company-label aggregate (7,302 attached observations in this snapshot).
- exact identity with no accepted bridge → `ZERO_MATCHING_ROWS`, not a clean
  record claim.
- affiliate-like or typo name → no evidence.
- `worst lenders by complaints` → unsupported; no ranking.
- `FHA lenders in Broward County` → unchanged HMDA property-market execution.
