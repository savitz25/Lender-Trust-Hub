# Pennsylvania HMDA deepen pass

**Goal:** Make Pennsylvania feel deeper than the initial major-county launch without inventing low-confidence matches.

## What improved

### County market intelligence (panel-ready)

| Wave | Counties |
|------|----------|
| **Initial** | 30 majors (Philly metro, Pittsburgh core, Lehigh Valley, south-central, NE PA, Erie) |
| **Deepen** | **+14** — Blair, Pike, Carbon, Lawrence, Northumberland, Clearfield, Wayne, Somerset, Crawford, Indiana, Columbia, Armstrong, Perry, Bedford (**44** total) |

Each major county resolves `getHmdaCountyEvidence('pennsylvania', slug)` for apps, originations, denials, loan mix, and top matched lenders where activity exists.

Rebuild: `python scripts/build-hmda-pennsylvania-slice.py`

### High-value lender mapping

| Metric | Before (launch) | After deepen |
|--------|-----------------|--------------|
| High-confidence LEI → directory maps | 79 | **91** |
| Lender–county activity rows (majors) | ~9.2k | **~11.5k** |
| Major named counties | 30 | **44** |

**New PA-focused LEI maps (GLEIF legal name + published company NMLS):**

| Institution | NMLS | Directory slug |
|-------------|------|----------------|
| Fulton Bank, N.A. | 485401 | `fulton-bank` |
| First National Bank of Pennsylvania | 766529 | `first-national-bank-of-pennsylvania` |
| First Commonwealth Bank | 479240 | `first-commonwealth-bank` |
| Northwest Bank | 419814 | `northwest-bank` |
| Huntington National Bank | 402436 | `huntington-national-bank` |
| Univest Bank and Trust Co. | 415882 | `univest-bank` |
| WSFS Bank | 417673 | `wsfs-bank` |
| Police & Fire Federal Credit Union | 800659 | `police-fire-federal-credit-union` |
| Mortgage America, Inc. | 128501 | `mortgage-america` |
| EMM Loans LLC | 2926 | `emm-loans` |
| HMA Mortgage (Affordable Mortgage Advisors) | 139164 | `hma-mortgage` |
| American Heritage Federal Credit Union | 433838 | `american-heritage-federal-credit-union` |

### Directory / hygiene

- `lib/mortgage/nationalHmdaLenders.ts` — twelve PA-deepen national / regional profiles
- `lib/geo/zip-to-county.ts` — ZIP hints for deepen counties + key PA HQ localities
- Multi-state primary-state behavior unchanged (FL…NY + PA)
- Reuse path now also reads NY curated LEI maps when the LEI has PA activity

## Mapping coverage summary

- **Mapped LEIs with PA originations:** 91 high-confidence directory links
- **Unmapped residual (intentionally deferred):** Members 1st FCU and PSECU (high PA volume; company NMLS not confidently published on primary mortgage pages in this pass), Dollar Bank / S&T Bank / Citadel FCU / TruMark (GLEIF identity known; company NMLS not verified to the same standard), Kiavi and similar private-money / non-QM niches, Plaza Home Mortgage / Provident Funding (national volume without a preferred host slug), remaining community banks without a verified public company NMLS + host pair
- **Reuse path:** FL / TX / GA / CA / NC / SC / NJ / NY curated LEIs still apply when the LEI has PA activity

## Intentionally deferred

- Low-confidence LEI inventing for remaining blanks
- Thin invented local branch profiles just to close volume gaps
- Every residual PA county under ~1k originations
- Parallel New York deepen work (untouched product folders)

## Files

- `scripts/build-hmda-pennsylvania-slice.py`
- `lib/hmda/states.ts` — PA major set (44)
- `data/hmda/pennsylvania/*` — rebuilt slice
- `lib/mortgage/nationalHmdaLenders.ts`
- `lib/geo/zip-to-county.ts`
- `docs/HMDA-PENNSYLVANIA-EXPANSION.md` — initial launch notes
