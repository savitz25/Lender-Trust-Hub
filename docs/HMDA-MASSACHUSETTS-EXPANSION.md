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

## Major counties (wave 1)

Middlesex, Worcester, Essex, Norfolk, Plymouth, Bristol, Suffolk, Hampden, Barnstable, Berkshire, Hampshire, Franklin

**Deferred (first pass):** Dukes, Nantucket (low volume; full 14-county market summary still available in slice).

## Matching

- Reuse prior product-state curated LEI maps when LEI has MA activity  
- MA curated (GLEIF + published company NMLS + directory host):
  - Leader Bank, Eastern Bank, Rockland Trust, Salem Five Mortgage, Total Mortgage Services  
- Precision only — no low-confidence inventing  
- See `data/hmda/massachusetts/README.md` for mapping counts  

## Stability

Does not modify FL / TX / GA / CA / NC / SC / NJ / NY / PA product folders.
