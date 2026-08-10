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

## Mapping coverage (deepen pass)

| Metric | Virginia | Maryland |
|--------|----------|----------|
| LEI maps (product slice) | ~116 | ~112 |
| Panel markets (majors) | **65** | **24** (full state) |
| County activity rows | ~13,252 | ~6,293 |
| Panel threshold (builder) | min ~700 originations | min ~300 originations |

Independent cities (e.g. Virginia Beach, Richmond, Norfolk, Alexandria, Manassas, Charlottesville) use their own FIPS codes and directory slugs.

## Major markets

### Virginia — wave 1 + deepen
**Wave 1 core:** Fairfax, Virginia Beach, Loudoun, Chesterfield, Prince William, Henrico, Chesapeake, Norfolk, Spotsylvania, Stafford, Richmond, Newport News, Hampton, Suffolk, Arlington, Hanover, Portsmouth, Frederick, Alexandria, Roanoke, Albemarle, James City, Roanoke City, Bedford, Augusta, Fauquier, Rockingham, York, Montgomery, Lynchburg, Louisa, Isle of Wight

**Deepen (next volume band):** Orange, Franklin, Shenandoah, Caroline, Campbell, Warren, Gloucester, New Kent, Washington, Pittsylvania, Powhatan, Botetourt, Fluvanna, Petersburg, Goochland, King George, Henry, Prince George, Pulaski, Westmoreland, Dinwiddie, Manassas, Staunton, Waynesboro, Amherst, Danville, King William, Mecklenburg, Accomack, Hopewell, Charlottesville, Salem, Carroll

### Maryland — full panel set
Prince George’s, Montgomery, Baltimore County, Anne Arundel, Baltimore City, Frederick, Howard, Harford, Charles, Carroll, Washington, St. Mary’s, Calvert, Cecil, Worcester, Wicomico, Queen Anne’s, Allegany, Talbot, Dorchester, Caroline, Garrett, **Kent**, **Somerset**

## Matching

- Reuse prior product-state curated LEI maps when LEI has state activity  
- Precision only — no low-confidence LEI inventing  

### Wave 1 curated (GLEIF + published company NMLS)
| Lender | NMLS | Slug |
|--------|------|------|
| Alcova Mortgage | 40508 | `alcova-mortgage` |
| Atlantic Coast Mortgage | 643114 | `atlantic-coast-mortgage` |
| Atlantic Union Bank | 551889 | `atlantic-union-bank` |
| First Home Mortgage | 71603 | `first-home-mortgage` |
| Tower Federal Credit Union | 586147 | `tower-federal-credit-union` |
| TowneBank | 512138 | `townebank` |

### Deepen curated
| Lender | NMLS | Slug |
|--------|------|------|
| Virginia Credit Union | 407552 | `virginia-credit-union` |
| Langley Federal Credit Union | 402897 | `langley-federal-credit-union` |
| C&F Mortgage Corporation | 147312 | `cf-mortgage` |
| BayPort Credit Union | 476890 | `bayport-credit-union` |
| Southern Trust Mortgage | 2921 | `southern-trust-mortgage` |
| Intercoastal Mortgage | 56323 | `intercoastal-mortgage` |
| United Bank | 522399 | `united-bank` |
| Direct Mortgage Loans | 832799 | `direct-mortgage-loans` |
| APG Federal Credit Union | 480340 | `apg-federal-credit-union` |

## What improved vs deferred

### Improved
- VA market intelligence beyond NOVA / Hampton Roads / Richmond core (65 panel markets)
- MD full 24-geography panel set (Kent + Somerset added)
- Nine additional high-confidence regional lenders with directory hosts + LEI maps
- Evidence panels reuse multi-state architecture; FL–NH slices unchanged

### Intentionally deferred
- Tiny VA rural counties under ~700 originations (thin panels)
- SECU of Maryland — no clean company NMLS mapping found
- Apple Federal Credit Union — weak company NMLS signal
- Many smaller CUs / regionals without published company NMLS
- Perfect coverage of every VA independent city / county

## Stability

Does not modify existing product-state folders for the other 15 live states (FL–NH). Multi-state wiring remains intact for all 17 active states.
