# HMDA Virginia · Maryland expansion

**Vintage:** 2025  
**Source:** `data/hmda/by-state/{VA,MD}/`  
**Product slices:**  
- `data/hmda/virginia/`  
- `data/hmda/maryland/`

## Activate / rebuild

```bash
python scripts/process_hmda_national.py year_2025.csv   # if partitions missing
python scripts/build-hmda-va-md-slices.py
```

## What goes live

| Surface | Behavior |
|---------|----------|
| `/local-lenders/virginia/{market}` | County / independent-city market panels |
| `/local-lenders/maryland/{county}` | County / Baltimore City panels |
| `/lenders/{slug}` | State originations when LEI mapped |
| Analyzer | `va:`, `md:` prefill options |

## Major markets

### Virginia (wave 1 — high volume)
Fairfax, Virginia Beach, Loudoun, Chesterfield, Prince William, Henrico, Chesapeake, Norfolk, Spotsylvania, Stafford, Richmond, Newport News, Hampton, Suffolk, Arlington, Hanover, Portsmouth, Frederick, Alexandria, Roanoke, Albemarle, James City, Roanoke City, Bedford, Augusta, Fauquier, Rockingham, York, Montgomery, Lynchburg, Louisa, Isle of Wight

Independent cities (e.g. Virginia Beach, Richmond, Norfolk, Alexandria) use their own FIPS codes and slugs.

### Maryland (wave 1)
Prince George’s, Montgomery, Baltimore County, Anne Arundel, Baltimore City, Frederick, Howard, Harford, Charles, Carroll, Washington, St. Mary’s, Calvert, Cecil, Worcester, Wicomico, Queen Anne’s, Allegany, Talbot, Dorchester, Caroline, Garrett

## Matching

- Reuse prior product-state curated LEI maps when LEI has state activity  
- VA/MD curated (GLEIF + published company NMLS):
  - Alcova Mortgage (40508)
  - Atlantic Coast Mortgage (643114)
  - Atlantic Union Bank (551889)
  - First Home Mortgage (71603)
  - Tower Federal Credit Union (586147)
  - TowneBank (512138)
- Precision only  

## Stability

Does not modify existing product-state folders (FL–NH set).
