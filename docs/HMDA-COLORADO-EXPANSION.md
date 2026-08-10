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
| `/local-lenders/colorado/{county}` | Market panels for major counties |
| `/lenders/{slug}` | Colorado originations when LEI mapped |
| Analyzer | `co:{county}` prefill options |

## Mapping coverage (deepen pass)

| Metric | Colorado |
|--------|----------|
| Panel markets (majors) | **30** |
| High-confidence LEI maps | see slice README after rebuild |

## Major counties

### Wave 1 (20)
El Paso, Jefferson, Arapahoe, Denver, Adams, Douglas, Weld, Larimer, Boulder, Mesa, Pueblo, Broomfield, Garfield, Eagle, Summit, La Plata, Elbert, Fremont, Teller, Montrose

### Deepen (10)
Grand, Park, Delta, Routt, Chaffee, Morgan, Archuleta, Gunnison, Pitkin, Montezuma

## Matching

- Reuse prior product-state curated LEI maps when the LEI has Colorado activity  
- Precision only — no low-confidence LEI inventing  

### Wave 1 curated
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

### Deepen curated
| Lender | NMLS | Slug |
|--------|------|------|
| Zions Bancorporation / Zions Bank | 467014 | `zions-bank` |
| Westerra Credit Union | 421606 | `westerra-credit-union` |
| Benchmark Mortgage (Ark-La-Tex) | 2143 | `benchmark-mortgage` |
| Loan Simple | 3032 | `loan-simple` |
| Security Service Federal Credit Union | 458903 | `security-service-federal-credit-union` |
| BOK Financial | 403501 | `bok-financial` |
| Climb Credit Union | 422866 | `climb-credit-union` |
| Bank of Colorado | (LEI identity) | `bank-of-colorado` |
| Credit Union of Colorado | (LEI identity) | `credit-union-of-colorado` |

## What improved vs deferred

### Improved
- County panels expanded beyond Front Range / first mountain set (**30** majors)  
- Nine additional high-confidence regional lenders with directory hosts + LEI maps  
- Multi-state wiring intact for all **26** live product states  

### Intentionally deferred
- Full 64-county coverage (thin rural panels)  
- First Western Trust Bank, Meritrust CU, Central Trust Bank — no clean company NMLS + host pairing in this pass  
- Low-confidence LEI inventing  

## Stability

Does not modify Arizona or other existing product-state folders.
