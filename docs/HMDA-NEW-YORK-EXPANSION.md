# HMDA New York expansion

**Vintage:** 2025  
**Source:** `data/hmda/by-state/NY/` (from `year_2025.csv` national foundation)  
**Product slice:** `data/hmda/new-york/`

## Activate / rebuild

```bash
python scripts/process_hmda_national.py year_2025.csv   # if partition missing
python scripts/build-hmda-new-york-slice.py
```

## What goes live

| Surface | Behavior |
|---------|----------|
| `/local-lenders/new-york/{county}` | County market panel for major counties |
| `/lenders/{slug}` | NY originations when LEI mapped |
| Loan Estimate Analyzer | `ny:{county}` prefill options |

## Major counties (wave 1)

Suffolk, Nassau, Erie, Monroe, Queens, Kings, Westchester, Onondaga, New York County / Manhattan (`new-york-county`), Orange, Albany, Richmond, Dutchess, Saratoga, Rockland, Bronx, Niagara, Oneida, Schenectady, Rensselaer, Ulster, Broome

**Slug note:** HMDA names Manhattan as “New York” county; the directory URL is `/local-lenders/new-york/new-york-county`. Loaders map FIPS `36061` → `new-york-county`.

## Matching

- Reuse FL/TX/GA/CA/NC/SC/NJ curated LEI maps when LEI has NY activity  
- Precision only — no low-confidence inventing  
- See `data/hmda/new-york/README.md` for mapping counts  

## Stability

Does not modify FL/TX/GA/CA/NC/SC/NJ product folders.
