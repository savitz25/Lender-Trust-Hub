# Ask specialist execution V2 — LenderTrustHub

Endpoint: `GET|POST /api/specialist-execution/v2`  
Contract: `trusthub-specialist-execution-v2`  
Version: `2.0.0`

The endpoint is a normalization layer over the accepted `lender-ask-v1` HMDA
executor. It does not query AskTrustHub, add an HMDA index, or change publication.
The response publishes deterministic SHA-256 schema and contract fingerprints.

## Supported request

POST accepts `queryType=market_cohort`,
`entityClass=hmda_reporting_institution`, `geography.intent=PROPERTY_MARKET`, a
supported state code or Florida county/FIPS, `action` (`application`, `origination`,
`denial`), optional `loanType` (`conventional`, `FHA`, `VA`, `USDA`, `other`), and
bounded `page`/`limit` (maximum 50). GET accepts the equivalent research question in
`q`, plus page and limit.

Rows are HMDA reporting institutions identified by LEI crossed with the selected
property geography, action, optional loan type, and 2025 reporting vintage. State and
county grains are never added. Ordering is raw source-reported activity descending
with LEI tie-break; it is not a quality or recommendation ranking.

## Response

The envelope contains `queryInterpretation`, `appliedFilters`, `resultState`, bounded
`rows`, exact `total`, `pagination`, `availableRefinements`, `provenance`,
`limitations`, publication-safe `destinations`, and execution `diagnostics`.

States are `SUPPORTED_RESULTS`, `ZERO_MATCHING_ROWS`, `CLARIFICATION_REQUIRED`,
`UNSUPPORTED_CAPABILITY`, `PUBLICATION_RESTRICTED`, `INVALID_QUERY`,
`BACKEND_UNAVAILABLE`, `TIMEOUT`, `NO_CONFIDENT_MATCH`, and `EXACT_IDENTITY`.
Supported zero uses HTTP 200; invalid is 400; clarification, unsupported, and
publication restrictions are 422; backend unavailable is 503; timeout is 504.

## Semantics and restrictions

- HMDA geography is property/census geography associated with an application. It is
  not institution headquarters, branch location, licensing, or service territory.
- Application, origination, and denial are separate. Denial count is neither denial
  reason nor a fair-lending finding.
- Counts are supported. Rates, shares, and medians require compatible denominators
  and fail closed when unavailable.
- Purpose splits are not reconstructed at LEI grain.
- LEI is the HMDA row identity. NMLS is displayed only from the accepted exact bridge.
- A research row may have no public profile. Null destinations are preserved;
  `identity_hold` remains unlinked.
- Branch and MLO/person cohort publication is prohibited.
- Exact NMLS/LEI and named-lender CFPB evidence are deferred to LEND-CAP-002 with no
  fuzzy or market-cohort fallback.

## Provenance and source clock

Primary source: committed HMDA 2025 lender state and Florida county market catalogs.
The response returns exact source file names, reporting period, query grain, method,
identity policy, publication gate, and cache semantics. Deployment time is not source
freshness. HMDA 2025 is not described as live 2026 activity.

## Examples

- `FHA lenders in Broward County` → Broward FIPS 12011, FHA originations, bounded LEI rows.
- `mortgage lenders reporting originations in Palm Beach County` → FIPS 12099.
- `lenders in Texas` → clarification: property market vs HQ vs branch vs service.
- `lenders serving Florida` → unsupported service-territory capability.
- `NMLS 170008` or labeled LEI → unsupported until LEND-CAP-002; no fallback.
- `complaints about Rocket Mortgage` → unsupported identity-bound complaint evidence;
  general CFPB coverage is not represented as Rocket evidence.

Timeouts return a normalized `TIMEOUT` envelope when the runtime terminates execution;
backend catalog failures return `BACKEND_UNAVAILABLE` without fallback rows.
