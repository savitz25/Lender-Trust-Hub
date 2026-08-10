# HMDA Rhode Island · Vermont · Maine expansion

**Vintage:** 2025  
**Source:** `data/hmda/by-state/{RI,VT,ME}/`  
**Product slices:**  
- `data/hmda/rhode-island/`  
- `data/hmda/vermont/`  
- `data/hmda/maine/`

## Activate / rebuild

```bash
python scripts/process_hmda_national.py year_2025.csv   # if partitions missing
python scripts/build-hmda-ri-vt-me-slices.py
```

## What goes live

| Surface | Behavior |
|---------|----------|
| `/local-lenders/rhode-island/{county}` | County market panels for all 5 RI counties |
| `/local-lenders/vermont/{county}` | Higher-activity VT counties |
| `/local-lenders/maine/{county}` | Meaningful ME counties |
| `/lenders/{slug}` | State originations when LEI mapped |
| Analyzer | `ri:`, `vt:`, `me:` prefill options |

## Major counties

### Rhode Island (all 5)
Providence, Kent, Washington, Newport, Bristol

### Vermont (12 higher-activity)
Chittenden, Washington, Franklin, Windsor, Rutland, Windham, Lamoille, Addison, Orleans, Bennington, Caledonia, Orange  

**Deferred:** Essex, Grand Isle (very low volume)

### Maine (16 counties)
Cumberland, York, Penobscot, Kennebec, Androscoggin, Oxford, Hancock, Somerset, Aroostook, Waldo, Knox, Lincoln, Sagadahoc, Washington, Franklin, Piscataquis

## Matching

- Reuse prior product-state curated LEI maps when LEI has state activity  
- NE curated (GLEIF + published company NMLS):
  - Washington Trust Mortgage (901927)
  - BankNewport (407964)
  - Primary Residential Mortgage / PRMI (3094)
  - Bangor Savings Bank (449200)
  - Camden National Bank (486887)
- Precision only — no low-confidence inventing  

## Stability

Does not modify FL / TX / GA / CA / NC / SC / NJ / NY / PA / MA product folders.
