# LEND-NAT-003 — HMDA canonical attribution

**Status:** COMPLETE  
**Date:** 2026-08-26  
**Public impact:** NONE

Internal graph: `public.lender_hmda_observations`  
Manifest: `docs/lend-nat-003-manifest.json`

HMDA 2025 is a **reporting vintage**, not current 2026 lending activity.

## Grain

`(data_year, LEI, geo_grain, state_code, county_fips)`

- County: 418,078 rows from `data/hmda/by-state/*/lender_activity_by_county.csv`
- State: 36,402 rows from `data/hmda/national/lender_state_summary.csv`
- Institution ID nullable attribution; LEI always stored
- Purchase/refinance **originations** NULL (unsupported at LEI grain)
- County-market `purchase_count` is **application purpose**, not origination

## Coverage (state grain)

| | Attached (246 LEIs) | Orphan (4,469 LEIs) | Total |
| --- | ---: | ---: | ---: |
| Applications | 4,991,120 (42.85%) | 6,657,024 (57.15%) | 11,648,144 |
| Originations | 2,847,019 (41.91%) | 3,946,234 (58.09%) | 6,793,253 |

5.22% of LEIs hold ~42% of originations. Top unresolved volume is mostly **quarantined mapping collisions**, not missing data.

Identity graph unchanged: 460 institutions, 5,176 identifiers, 39 conflicts.
