# HMDA Oregon · Washington expansion

**Vintage:** 2025  
**Source:** `data/hmda/by-state/{OR,WA}/`  
**Product slices:**  
- `data/hmda/oregon/`  
- `data/hmda/washington/`

## Activate / rebuild

```bash
python scripts/process_hmda_national.py year_2025.csv   # if partitions missing
python scripts/build-hmda-or-wa-slices.py
```

## What goes live

| Surface | Behavior |
|---------|----------|
| `/local-lenders/oregon/{county}` | Market panels for major counties |
| `/local-lenders/washington/{county}` | Market panels for major counties |
| `/lenders/{slug}` | State originations when LEI mapped |
| Analyzer | `or:{county}`, `wa:{county}` prefill options |

## Wave 1 coverage

| Metric | Oregon | Washington |
|--------|--------|------------|
| Panel markets (majors) | **18** | **18** |
| High-confidence LEI maps | see slice README after rebuild | see slice README after rebuild |

### Oregon major counties

Multnomah, Washington, Clackamas, Lane, Marion, Deschutes, Jackson, Linn, Yamhill, Douglas, Polk, Josephine, Umatilla, Klamath, Benton, Coos, Lincoln, Columbia

### Washington major counties

King, Pierce, Snohomish, Spokane, Clark, Thurston, Kitsap, Whatcom, Benton, Yakima, Cowlitz, Skagit, Island, Lewis, Mason, Grant, Grays Harbor, Franklin

## Matching

- Reuse prior product-state curated LEI maps when the LEI has OR or WA activity  
- Precision only — no low-confidence LEI inventing  
- GLEIF re-identification for high-value nationals (including Movement, DHI, BofA where prior maps collided)  
- Identity-first directory rows for high-volume PNW regionals in `nationalHmdaLenders.ts`  

### Regional LEI-identity maps (examples)

| Lender | Slug |
|--------|------|
| OnPoint Community CU | `onpoint-community-credit-union` |
| BECU | `boeing-employees-credit-union` |
| Columbia Bank | `columbia-bank-pnw` |
| Banner Bank | `banner-bank` |
| WSECU | `washington-state-employees-credit-union` |
| Gesa CU | `gesa-credit-union` |
| Spokane Teachers CU | `spokane-teachers-credit-union` |
| Rogue CU | `rogue-credit-union` |
| First Tech FCU | `first-tech-federal-credit-union` |
| SELCO | `selco-community-credit-union` |
| Oregon State CU | `oregon-state-credit-union` |
| Evergreen MoneySource | `evergreen-moneysource-mortgage` |
| 1st Security Bank of WA | `first-security-bank-washington` |

Plus nationals: Rocket, UWM, Guild, Fairway, PennyMac, AmeriHome, etc.

## Deferred

- Full perfect coverage of every OR/WA county  
- Lower-volume regionals without high-confidence directory link  
- Company NMLS inventing where not verified  

## Parallel work

Does not modify Alabama / Louisiana product slices. Rebuild writes only `oregon/` and `washington/` plus shared national directory rows for these regionals.
