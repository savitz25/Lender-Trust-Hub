# HMDA Missouri · Kentucky expansion

**Vintage:** 2025  
**Source:** `data/hmda/by-state/{MO,KY}/`  
**Product slices:**  
- `data/hmda/missouri/`  
- `data/hmda/kentucky/`

## Activate / rebuild

```bash
python scripts/process_hmda_national.py year_2025.csv   # if partitions missing
python scripts/build-hmda-mo-ky-slices.py
```

## What goes live

| Surface | Behavior |
|---------|----------|
| `/local-lenders/missouri/{county}` | Market panels for major counties |
| `/local-lenders/kentucky/{county}` | Market panels for major counties |
| `/lenders/{slug}` | State originations when LEI mapped |
| Analyzer | `mo:{county}`, `ky:{county}` prefill options |

## Wave 1 coverage

| Metric | Missouri | Kentucky |
|--------|----------|----------|
| Panel markets (majors) | **18** | **18** |
| High-confidence LEI maps | see slice README after rebuild | see slice README after rebuild |

### Missouri major counties

St. Louis, Jackson, St. Charles, Greene, Clay, Jefferson, St. Louis City, Boone, Cass, Jasper, Christian, Platte, Franklin, Cole, Buchanan, Cape Girardeau, Lincoln, Camden

### Kentucky major counties

Jefferson, Fayette, Kenton, Boone, Warren, Hardin, Campbell, Bullitt, Madison, Daviess, Oldham, Scott, Jessamine, Shelby, Christian, McCracken, Franklin, Nelson

## Matching

- Reuse prior product-state curated LEI maps when the LEI has MO or KY activity  
- Precision only — no low-confidence LEI inventing  
- GLEIF re-identification for high-value nationals where prior maps collided  
- Identity-first directory rows for high-volume regionals in `nationalHmdaLenders.ts`  

### Regional LEI-identity maps (examples)

| Lender | Slug |
|--------|------|
| Flat Branch Mortgage | `flat-branch-mortgage` |
| Central Trust Bank | `central-trust-bank` |
| CommunityAmerica FCU | `communityamerica-federal-credit-union` |
| DAS Acquisition | `das-acquisition-company` |
| Commerce Bank | `commerce-bank` |
| Arvest Bank | `arvest-bank` |
| Stockton Mortgage | `stockton-mortgage` |
| Community Trust Bank | `community-trust-bank` |
| Stock Yards Bank & Trust | `stock-yards-bank-trust` |
| Commonwealth FCU | `commonwealth-federal-credit-union` |
| Republic Bank & Trust (KY) | `republic-bank-trust-kentucky` |

Plus nationals: Rocket, UWM, Guild, VU/MRC, Fairway, PennyMac, Eagle Home, PNC, German American, Liberty FCU, etc.

## Deferred

- Full perfect coverage of every MO/KY county  
- Lower-volume regionals without high-confidence directory link  
- Company NMLS inventing where not verified  

## Parallel work

Does not modify Utah / Nevada product slices. Rebuild writes only `missouri/` and `kentucky/` plus shared national directory rows for these regionals.
