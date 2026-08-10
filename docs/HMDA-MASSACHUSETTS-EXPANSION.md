# HMDA Massachusetts expansion

**Vintage:** 2025  
**Source:** `data/hmda/by-state/MA/` (from `year_2025.csv` national foundation)  
**Product slice:** `data/hmda/massachusetts/`

## Activate / rebuild

```bash
python scripts/process_hmda_national.py year_2025.csv   # if partition missing
python scripts/build-hmda-massachusetts-slice.py
```

## What goes live

| Surface | Behavior |
|---------|----------|
| `/local-lenders/massachusetts/{county}` | County market panel for major counties |
| `/lenders/{slug}` | MA originations when LEI mapped |
| Loan Estimate Analyzer | `ma:{county}` prefill options |

## Major counties

### Wave 1
Middlesex, Worcester, Essex, Norfolk, Plymouth, Bristol, Suffolk, Hampden, Barnstable, Berkshire, Hampshire, Franklin

### Deepen (full state)
**Dukes** (Martha’s Vineyard), **Nantucket** — lower volume but panel-ready for complete MA coverage

## Matching

### Wave 1 curated
Leader Bank, Eastern Bank, Rockland Trust, Salem Five Mortgage, Total Mortgage Services

### Deepen curated (GLEIF + published company NMLS)
| Lender | NMLS | Notes |
|--------|------|--------|
| Cape Cod Five | 401717 | Barnstable / Cape |
| Middlesex Savings Bank | 440578 | MetroWest |
| Cambridge Savings Bank | 543370 | Greater Boston |
| Workers Credit Union | 472618 | Central MA |
| Northpoint Mortgage | 1515 | Sturbridge HQ |
| HarborOne Mortgage | 2561 | New England IMC |
| BayCoast Mortgage | 1082048 | South Coast |
| Radius Financial Group | 1846 | Norwell HQ |
| Needham Bank | 2141744 | Norfolk County |

Also reuses prior product-state LEI maps when LEI has MA activity. Precision only.

## Intentionally deferred

- Regionals / CUs without a verified public company NMLS + host (e.g. Bankesb / incomplete GLEIF label, First Technology FCU, Greylock FCU, Webster Bank pending verified company NMLS, Berkshire Bank company NMLS confirmation)
- Low-confidence inventing of LEI→slug links

## Stability

Does not modify FL / TX / GA / CA / NC / SC / NJ / NY / PA product folders.
