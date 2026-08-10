# HMDA Tennessee expansion

**Vintage:** 2025  
**Source:** `data/hmda/by-state/TN/`  
**Product slice:** `data/hmda/tennessee/`

## Activate / rebuild

```bash
python scripts/process_hmda_national.py year_2025.csv   # if partitions missing
python scripts/build-hmda-tn-slices.py
```

## What goes live

| Surface | Behavior |
|---------|----------|
| `/local-lenders/tennessee/{county}` | Market panels for wave-1 major counties |
| `/lenders/{slug}` | Tennessee originations when LEI mapped |
| Analyzer | `tn:{county}` prefill options |

## Major counties (wave 1)

| FIPS | Name | Panel slug |
|------|------|------------|
| 47037 | Davidson | `davidson` |
| 47157 | Shelby | `shelby` |
| 47093 | Knox | `knox` |
| 47065 | Hamilton | `hamilton` |
| 47149 | Rutherford | `rutherford` |
| 47125 | Montgomery | `montgomery` |
| 47187 | Williamson | `williamson` |
| 47165 | Sumner | `sumner` |
| 47189 | Wilson | `wilson` |
| 47163 | Sullivan | `sullivan` |
| 47009 | Blount | `blount` |
| 47119 | Maury | `maury` |
| 47179 | Washington | `washington` |
| 47155 | Sevier | `sevier` |
| 47011 | Bradley | `bradley` |
| 47147 | Robertson | `robertson` |
| 47113 | Madison | `madison` |
| 47001 | Anderson | `anderson` |
| 47105 | Loudon | `loudon` |
| 47141 | Putnam | `putnam` |

## Matching

- Reuse prior product-state curated LEI maps when the LEI has Tennessee activity  
- Precision only — no low-confidence LEI inventing  

### TN curated (GLEIF + published company NMLS)

| Lender | NMLS | Slug |
|--------|------|------|
| FirstBank | 472433 | `firstbank-tennessee` |
| Mortgage Investors Group | 34391 | `mortgage-investors-group-knoxville` |
| Pinnacle Bank | 418535 | `pinnacle-bank` |
| First Community Mortgage | 629700 | `first-community-mortgage` |
| Knoxville TVA Employees Credit Union | 167911 | `knoxville-tva-employees-credit-union` |
| Ascend Federal Credit Union | 451452 | `ascend-federal-credit-union` |
| Cadence Bank | 402436 | `cadence-bank` |
| Wilson Bank and Trust | 767482 | `wilson-bank-and-trust` |
| Tennessee Valley Federal Credit Union | 460298 | `tennessee-valley-federal-credit-union` |

Regions Bank, First Horizon, Rocket, UWM, and other multi-state lenders reuse prior maps.

## Intentionally deferred

- Full 95-county coverage (rural / thin panels)  
- Eastman Credit Union, ORNL FCU, Leaders CU, Legacy Home Loans, Primis Mortgage, Old National — no clean company NMLS + directory host pairing in this pass  
- Low-confidence LEI inventing  

## Stability

Does not modify existing product-state folders for the other 19 live states. Multi-state wiring remains intact for all **20** active product states after this activation.
