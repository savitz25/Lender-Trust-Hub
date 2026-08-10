# HMDA Arizona expansion

**Vintage:** 2025  
**Source:** `data/hmda/by-state/AZ/`  
**Product slice:** `data/hmda/arizona/`

## Activate / rebuild

```bash
python scripts/process_hmda_national.py year_2025.csv   # if partitions missing
python scripts/build-hmda-arizona-slice.py
```

## What goes live

| Surface | Behavior |
|---------|----------|
| `/local-lenders/arizona/{county}` | Market panels for major counties |
| `/lenders/{slug}` | Arizona originations when LEI mapped |
| Analyzer | `az:{county}` prefill options |

## Wave 1 coverage

| Metric | Value |
|--------|-------|
| Panel markets (majors) | **12** |
| High-confidence LEI maps | see `data/hmda/arizona/README.md` after rebuild |

### Major counties

Maricopa, Pima, Pinal, Yavapai, Mohave, Yuma, Coconino, Cochise, Navajo, Gila, Santa Cruz, Graham

### Curated AZ matches (high confidence)

| Lender | NMLS | Slug |
|--------|------|------|
| Desert Financial Credit Union | 430888 | `desert-financial-credit-union` |
| Nova Home Loans | 3089 | `nova-home-loans-west-valley` |
| OneAZ Credit Union | 439822 | `oneaz-credit-union-east-valley` |
| Guild Mortgage | 3274 | `guild-mortgage-west-valley` |

Plus reuse of national / prior-state LEI maps (UWM, Rocket, Freedom, PennyMac, Chase, etc.) when AZ activity exists.

### Deferred (no thin inventing)

VIP Mortgage, Arizona Financial CU, Vantage West, Copper State CU, and similar high-volume LEIs without a precise directory slug stay unmapped until a high-confidence profile exists.

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has AZ activity  
- Precision over coverage  
- Prefer AZ directory branch slugs (e.g. Guild West Valley)  

## Parallel work

Does not modify Michigan / Indiana product slices. Builder 1 deepen of MI/IN remains independent.
