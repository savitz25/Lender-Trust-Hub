# South Carolina HMDA deepen pass

**Goal:** Make South Carolina feel deeper than the initial major-county launch without inventing low-confidence matches.

## What improved

### County market intelligence (panel-ready)

| Wave | Counties |
|------|----------|
| **Initial** | 20 majors (Horry, Greenville, Charleston, Spartanburg, Richland, Berkeley, York, Lexington, Beaufort, Dorchester, Anderson, Aiken, Lancaster, Sumter*, Florence, Pickens*, Kershaw, Laurens, Jasper, Georgetown) |
| **Hygiene** | Corrected FIPS: **Sumter = `45085`**, **Pickens = `45077`**, **Oconee = `45073`** (wave 1 had Sumter/Pickens FIPS swapped/misnamed) |
| **Deepen** | **+10** — Oconee (named correctly), Orangeburg, Greenwood, Cherokee, Darlington, Chester, Colleton, Chesterfield, Edgefield, Newberry (**30** total panel-ready) |

Each major county resolves `getHmdaCountyEvidence('south-carolina', slug)` for apps, originations, denials, loan mix, and top matched lenders where activity exists.

Rebuild: `python scripts/build-hmda-south-carolina-slice.py`

### High-value lender mapping

| Metric | Before | After |
|--------|--------|-------|
| High-confidence LEI → directory maps | 63 | **75** |
| Lender–county activity rows (majors) | ~7.0k | **~8.5k** |
| Major named counties | 20 | **30** |

**New SC-focused LEI maps (GLEIF legal name + published company NMLS):**

| Institution | NMLS | Directory slug |
|-------------|------|----------------|
| Vanderbilt Mortgage / Silverton DBA | 1561 | `silverton-mortgage-myrtle-beach` |
| Atlantic Bay Mortgage Group | 72043 | `atlantic-bay-mortgage-charleston` |
| Gateway First Bank | 7233 | `gateway-mortgage-myrtle-beach` |
| Carolina One Mortgage | 1086435 | `carolina-one-mortgage` |
| First-Citizens Bank & Trust | 503941 | `first-citizens-bank` |
| Lower, LLC | 1124061 | `lower` |
| NVR Mortgage Finance | 1127 | `nvr-mortgage` |
| First Heritage Mortgage | 86548 | `first-heritage-mortgage` |
| New Day Financial | 1043 | `new-day-financial` |
| United Community Bank | 421841 | `united-community-bank` |
| Southern First Bank | 754127 | `southern-first-bank` |
| Guaranteed Rate Affinity | 1598647 | `guaranteed-rate-affinity` |

Also prefers SC directory host for PrimeLending company NMLS (`primelending-greenville`).

### Directory / hygiene

- `lib/mortgage/nationalHmdaLenders.ts` — eight SC-deepen national / regional profiles
- `lib/geo/zip-to-county.ts` — additional SC ZIP hints (majors + deepen markets)
- Hub copy: Georgetown, Pickens, Dorchester, Oconee marked as live panels where applicable
- Multi-state primary-state behavior unchanged (FL / TX / GA / CA / NC / SC)

## Mapping coverage summary

- **Mapped LEIs with SC originations:** 75 high-confidence directory links
- **Unmapped residual:** large credit-union and community-bank LEIs without a clean directory host (Founders FCU, SC State FCU, SC Federal CU, Palmetto Citizens FCU, SAFE FCU, First Reliance, First Palmetto, Countybank, etc.), plus niche non-QM / private-money names without verified NMLS+slug pairs
- **Reuse path:** FL / TX / GA / CA / NC curated LEIs still apply when the LEI has SC activity

## Intentionally deferred

- Full SC county coverage (46 counties in extract; 30 panel-ready)
- Low-confidence LEI inventing for remaining blanks
- Thin invented local branch profiles just to close volume gaps
- Next state after SC

## Files

- `scripts/build-hmda-south-carolina-slice.py`
- `lib/hmda/states.ts` — SC major set
- `data/hmda/south-carolina/*` — rebuilt slice
- `lib/mortgage/nationalHmdaLenders.ts`
- `lib/mortgage/southCarolinaLenders.ts` — hub labels
- `lib/geo/zip-to-county.ts`
- `docs/HMDA-SOUTH-CAROLINA-EXPANSION.md` — initial launch notes
