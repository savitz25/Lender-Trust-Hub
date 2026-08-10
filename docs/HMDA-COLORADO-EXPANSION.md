# HMDA Colorado expansion

**Vintage:** 2025  
**Source:** `data/hmda/by-state/CO/`  
**Product slice:** `data/hmda/colorado/`

## Activate / rebuild

```bash
python scripts/process_hmda_national.py year_2025.csv   # if partitions missing
python scripts/build-hmda-co-slices.py
```

## What goes live

| Surface | Behavior |
|---------|----------|
| `/local-lenders/colorado/{county}` | Market panels for wave-1 major counties |
| `/lenders/{slug}` | Colorado originations when LEI mapped |
| Analyzer | `co:{county}` prefill options |

## Major counties (wave 1 — 20)

El Paso, Jefferson, Arapahoe, Denver, Adams, Douglas, Weld, Larimer, Boulder, Mesa, Pueblo, Broomfield, Garfield, Eagle, Summit, La Plata, Elbert, Fremont, Teller, Montrose

## Matching

- Reuse prior product-state curated LEI maps when the LEI has Colorado activity  
- Precision only — no low-confidence LEI inventing  

### CO curated (GLEIF + published company NMLS or LEI identity)

| Lender | NMLS | Slug |
|--------|------|------|
| Wings Credit Union | 405466 | `wings-credit-union` |
| FirstBank (Colorado) | (LEI identity) | `firstbank-colorado` |
| Elevations Credit Union | 717246 | `elevations-credit-union` |
| Canvas Credit Union | 410592 | `canvas-credit-union` |
| Bellco Credit Union | (LEI identity) | `bellco-credit-union` |
| V.I.P. Mortgage | 145502 | `vip-mortgage` |
| HomeAmerican Mortgage | 130676 | `homeamerican-mortgage` |
| American Financing | 182334 | `american-financing` |
| Alpine Bank | 414674 | `alpine-bank` |

UWM, Rocket, Ally, Freedom, Fairway, U.S. Bank, and other multi-state lenders reuse prior maps.

**Notes:**  
- FirstBank (CO) is distinct from Tennessee FirstBank (`firstbank-tennessee`).  
- Bellco maps by LEI identity (mortgage affiliate NMLS differs from the credit union).  

## Intentionally deferred

- Full 64-county coverage  
- Bank of Colorado, Credit Union of Colorado, Zions Bancorporation — no clean company NMLS + host pairing in this pass  
- Low-confidence LEI inventing  

## Stability

Does not modify Arizona or other existing product-state folders. Multi-state wiring remains intact for all **26** active product states after this activation.
