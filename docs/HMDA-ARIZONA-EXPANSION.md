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

## Coverage

| Metric | Wave 1 | After deepen |
|--------|--------|--------------|
| Panel markets (majors) | 12 | **15** (full AZ county set) |
| High-confidence LEI maps | ~118 | see `data/hmda/arizona/README.md` after rebuild |
| Lender–county activity (majors) | ~3,961 | rebuild output |

### Major counties

**Wave 1:** Maricopa, Pima, Pinal, Yavapai, Mohave, Yuma, Coconino, Cochise, Navajo, Gila, Santa Cruz, Graham  

**Deepen:** Apache, La Paz, Greenlee (remaining AZ counties with HMDA filings)

### Curated AZ matches (high confidence)

#### Regional / directory
| Lender | NMLS | Slug |
|--------|------|------|
| Desert Financial Credit Union | 430888 | `desert-financial-credit-union` |
| Nova Home Loans | 3089 | `nova-home-loans-west-valley` |
| OneAZ Credit Union | 439822 | `oneaz-credit-union-east-valley` |
| Sun American Mortgage | 127772 | `sun-american-mortgage-queen-creek` |
| Guild Mortgage | 3274 | `guild-mortgage-west-valley` |
| CrossCountry Mortgage | 3029 | `crosscountry-mortgage-west-valley` |
| DHI Mortgage | 14622 | `dhi-mortgage-buckeye` |
| Lennar Mortgage | 1058 | `lennar-mortgage-queen-creek` |
| Bank of America | 399802 | `bank-of-america-mortgage-west-valley` |
| Veterans United (MRC) | 1907 | `veterans-united-west-valley` |
| New American Funding | 6606 | `new-american-funding-west-valley` |
| Silverton (Vanderbilt) | 1561 | `silverton-mortgage-west-valley` |

#### Nationals re-identified via GLEIF (AZ evidence quality)
| Lender | NMLS | Slug |
|--------|------|------|
| Freedom Mortgage | 2767 | `freedom-mortgage` |
| Fairway Independent | 2909 | `fairway-mortgage-augusta-sheppard` |
| PennyMac Loan Services | 35953 | `pennymac` |
| loanDepot.com | 174457 | `loandepot` |
| Movement Mortgage | 39179 | `movement-mortgage-myrtle-beach` |
| Guaranteed Rate | 2611 | `guaranteed-rate` |
| Nationstar / Mr. Cooper | 2104 | `mr-cooper` |
| PrimeLending | 1921 | `primelending-columbus` |

Plus reuse of other prior-state maps when AZ activity exists (UWM, Rocket, Chase, etc.).

### Deferred (no thin inventing)

| Entity | Why deferred |
|--------|----------------|
| VIP Mortgage | High AZ volume; no directory slug |
| Arizona Financial Credit Union | High AZ volume; no directory slug |
| Vantage West Credit Union | No directory slug |
| Copper State Credit Union | No directory slug |
| Taylor Morrison / KBHS / HomeAmerican captives | No AZ directory profiles |
| Bell Bank, Altitude Financial | No AZ directory profiles |

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has AZ activity  
- **AZ deepen pass** re-identifies high-value LEIs via live GLEIF legal names when older multi-state maps used colliding identities (AZ slice only)  
- Prefer AZ directory branch slugs  
- Precision over coverage  

## What improved vs deferred

### Improved
- Full 15-county market intelligence panel set  
- Correct LEI→slug for major AZ directory lenders (DHI, Lennar, BofA, VU, CCM, Guild, etc.)  
- Cleaner top-of-market AZ evidence ranking after GLEIF re-identification  

### Deferred
- Regional CUs / brokers without directory rows  
- Global repair of multi-state LEI maps outside Arizona (out of scope for this pass)

## Parallel work

Does not modify other product states’ slices. Rebuild is AZ-folder only.
