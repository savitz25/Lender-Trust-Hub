# NJ-LEND-002 public metric contract (publication planning only)

This document is **publication planning only**. It does not publish New Jersey,
does not change sitemap/robots/indexing, and does not expand public lender,
MLO, or servicer directories. Every candidate metric below remains
`internal_only` until a later ticket decides otherwise.

Product rule: organize evidence; do not tell consumers who is “best.”

## Identity metrics

| Metric | Source | Source date | Numerator / denominator | Grain | Computation | Caveat | Coverage |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RMLA company/branch counts by class and status | DOBI RMLA / NMLS roster | not acquired | count of official rows | license | none until roster arrives | Unavailable source is not zero licensed companies. Search-only absence is not unlicensed. | `SOURCE_AVAILABLE_BY_REQUEST` |
| Exact NMLS attachments | Printed NMLS ID on an official record | n/a | exact identifier matches | legal entity / branch | exact string | Do not attach unsafe name-only matches. | blocked without roster |
| NJHMFA participating lender count | Participating Lender Partners PDF | 2026-04-01 | listed names | participation observation | count of distinct normalized names on the acquired list | List omits approved participants with zero sales in the prior six months. Source order is loans sold, not quality. Participation is not an endorsement. Pairing form is a subset. | `ACQUIRED_CURRENT_SNAPSHOT` / incomplete vs all approved |

**Approved internal metrics:** coverage state, exact identifier counts, participation observations labeled with official terminology.

**Blocked metrics:** public RMLA directory, MLO directory, Qualified Individual directory, “approved lender,” Trust Score.

## HMDA metrics

| Metric | Source | Source date | Numerator / denominator | Grain | Computation | Caveat | Coverage |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Applications, originations, denials | Committed HMDA NJ slice | HMDA 2025 | counts from county_market_summary_nj.csv | state and 21 counties | sum of county rows for statewide | Properties located in New Jersey. Denial rate is denials/applications, not a quality score. | `ACQUIRED_CURRENT_SNAPSHOT` |
| Purchase / refinance mix | same | 2025 | purchase_count / total_applications | state / county | percent | Purpose counts are applications, not originations. | `ACQUIRED_CURRENT_SNAPSHOT` |
| Loan-type mix | same | 2025 | conventional/FHA/VA/USDA apps | state / county | percent | Descriptive only. | `ACQUIRED_CURRENT_SNAPSHOT` |
| Median loan amount | not in committed summary | — | — | — | not computed | Missing field is not zero. | `PARTIAL_SOURCE_COVERAGE` |
| Interest rate / total loan cost | not in committed summary | — | — | — | not computed | Missing field is not zero. | `PARTIAL_SOURCE_COVERAGE` |
| Denial reasons | not in committed summary | — | — | — | not computed | Missing field is not zero. | `PARTIAL_SOURCE_COVERAGE` |
| Lender-type mix | mapped LEI subset only | 2025 | mapped vs unmapped LEIs | state | identity coverage, not HMDA respondent type | Not a depository-vs-nonbank quality ranking. | `PARTIAL_SOURCE_COVERAGE` |

HMDA disparity is descriptive market evidence. It does not prove discrimination, unlawful conduct, intent, or redlining. No lender ranking from demographic disparities. County rows stay internal; no county pages.

## Servicer metrics

| Metric | Source | Coverage | Caveat |
| --- | --- | --- | --- |
| Licensed servicer count | DOBI / NMLS roster | `SOURCE_AVAILABLE_BY_REQUEST` | Unavailable ≠ zero. |
| Loans serviced, 30/60/90+ delinquency, foreclosures commenced | Annual report | `SOURCE_AVAILABLE_BY_REQUEST` | Delinquency ≠ misconduct. Foreclosure commenced ≠ violation. High default count ≠ bad servicer. No ranking. |

If rates are later calculated they must carry numerator, denominator, reporting year, loan population, source, and caveat.

## NJHMFA metrics

| Metric | Source | Source date | Caveat | Coverage |
| --- | --- | --- | --- | --- |
| Current programs | homebuyers page + fact sheets | 2026-06-17 | Official names only. Do not calculate consumer eligibility from county alone. | `ACQUIRED_CURRENT_SNAPSHOT` |
| County income / purchase-price limits | CoBranded FTHB fact sheet | 2026-06-17 | FHA/VA maximums may be more restrictive. UTA limits are higher and parcel-specific. Site Evaluator is advisory. | `ACQUIRED_CURRENT_SNAPSHOT` |
| DPA by county group | Smart Start Plus fact sheet | 2026-06-17 | $15,000 or $10,000 plus $7,000 first-generation. Not a qualification determination. | `ACQUIRED_CURRENT_SNAPSHOT` |
| Participating lenders | PDF list | 2026-04-01 | Not recommended/preferred/safer. Pairing subset ≠ full list. | `ACQUIRED_CURRENT_SNAPSHOT` |
| Bulletins | lender portal 2026 index | 2026 | Bulletin ≠ adverse evidence. | `ACQUIRED_CURRENT_SNAPSHOT` |

## Enforcement metrics

Reuse NJ-LEND-001 contract. Rematch updates identity relationships only. Do not recreate events. Individual orders stay internal-only and are not attached to a company unless the official action names the company.

## Blocked metrics

- Servicer ranking, lender ranking, complaint ranking, foreclosure ranking
- Complaint score
- Trust Score
- Public MLO or Qualified Individual directory
- Public RMLA directory expansion
- `/new-jersey` state intelligence route
- County publication pages
