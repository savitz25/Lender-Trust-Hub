# HMDA Delaware · District of Columbia expansion

**Vintage:** 2025  
**Source:** `data/hmda/by-state/{DE,DC}/`  
**Product slices:**  
- `data/hmda/delaware/`  
- `data/hmda/district-of-columbia/`

## Activate / rebuild

```bash
python scripts/process_hmda_national.py year_2025.csv   # if partitions missing
python scripts/build-hmda-de-dc-slices.py
```

## What goes live

| Surface | Behavior |
|---------|----------|
| `/local-lenders/delaware/{county}` | New Castle, Sussex, Kent market panels |
| `/local-lenders/district-of-columbia/district-of-columbia` | Single DC geography panel |
| `/lenders/{slug}` | State / district originations when LEI mapped |
| Analyzer | `de:{county}`, `dc:district-of-columbia` prefill options |

## Geography

### Delaware (full 3-county set)
| FIPS | Name | Panel slug |
|------|------|------------|
| 10003 | New Castle | `new-castle` |
| 10005 | Sussex | `sussex` |
| 10001 | Kent | `kent` |

### District of Columbia
| FIPS | Name | Panel slug |
|------|------|------------|
| 11001 | District of Columbia | `district-of-columbia` |

DC is one HMDA county-equivalent. Product path:

`/local-lenders/district-of-columbia/district-of-columbia`

## Matching

- Reuse prior product-state curated LEI maps when the LEI has DE or DC activity  
- Precision only — no low-confidence LEI inventing  

### DE / DC curated (GLEIF + published company NMLS)

| Lender | NMLS | Slug |
|--------|------|------|
| Pike Creek Mortgage Services | 130829 | `pike-creek-mortgage` |
| Meridian Bank | 462854 | `meridian-bank` |
| Keystone Funding | 144760 | `keystone-funding` |
| Del-One Federal Credit Union | 543572 | `del-one-federal-credit-union` |
| K. Hovnanian American Mortgage | 3259 | `k-hovnanian-american-mortgage` |
| First Savings Mortgage Corporation | 38694 | `first-savings-mortgage` |
| Bank-Fund Staff Federal Credit Union | 283762 | `bank-fund-staff-federal-credit-union` |
| Dover Federal Credit Union | 469346 | `dover-federal-credit-union` |

WSFS Bank (417673) and other multi-state lenders reuse prior maps when they have DE/DC activity.

## Intentionally deferred

- Capital Bank, N.A.; Vellum Mortgage; Luminate Bank; Nation One Mortgage; Dexsta — no clean published company NMLS + directory slug pairing in this pass  
- Thin inventing of profiles for low-volume LEIs  

## Stability

Does not modify existing product-state folders for the other 17 live states (FL–MD / VA–MD set). Multi-state wiring remains intact for all **19** active product states after this activation.
