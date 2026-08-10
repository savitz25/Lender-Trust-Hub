# HMDA Idaho · Montana · Wyoming expansion

**Vintage:** 2025  
**Source:** `data/hmda/by-state/{ID,MT,WY}/`  
**Product slices:**  
- `data/hmda/idaho/`  
- `data/hmda/montana/`  
- `data/hmda/wyoming/`

## Activate / rebuild

```bash
python scripts/process_hmda_national.py year_2025.csv   # if partitions missing
python scripts/build-hmda-id-mt-wy-slices.py
```

## What goes live

| Surface | Behavior |
|---------|----------|
| `/local-lenders/idaho/{county}` | Market panels for major counties |
| `/local-lenders/montana/{county}` | Market panels for major counties |
| `/local-lenders/wyoming/{county}` | Market panels for major counties |
| `/lenders/{slug}` | State originations when LEI mapped |
| Analyzer | `id:{county}`, `mt:{county}`, `wy:{county}` prefill |

## Wave 1 coverage

| Metric | Idaho | Montana | Wyoming |
|--------|-------|---------|---------|
| Panel markets (majors) | **14** | **10** | **11** |
| High-confidence LEI maps | see slice README | see slice README | see slice README |

### Idaho major counties

Ada, Canyon, Kootenai, Bonneville, Twin Falls, Bannock, Bonner, Bingham, Nez Perce, Jefferson, Elmore, Payette, Latah, Madison

### Montana major counties

Yellowstone, Gallatin, Flathead, Missoula, Cascade, Lewis and Clark, Ravalli, Silver Bow, Lake, Lincoln

### Wyoming major counties

Laramie, Natrona, Campbell, Sweetwater, Albany, Sheridan, Park, Fremont, Lincoln, Teton, Uinta

## Matching

- Reuse prior product-state curated LEI maps when the LEI has ID/MT/WY activity  
- Precision only — no low-confidence LEI inventing  
- GLEIF re-identification for high-value nationals where prior maps collided  
- Identity-first directory rows for high-volume Mountain West regionals  

### Regional LEI-identity maps (examples)

| State | Lender | Slug |
|-------|--------|------|
| ID | Idaho Central CU | `idaho-central-credit-union` |
| ID | Premier Mortgage Resources | `premier-mortgage-resources` |
| ID | Westmark CU | `westmark-credit-union` |
| MT | Stockman Bank | `stockman-bank-of-montana` |
| MT | Opportunity Bank of Montana | `opportunity-bank-of-montana` |
| MT/ID/WY | Glacier Bank | `glacier-bank` |
| MT/WY | First Interstate Bank | `first-interstate-bank` |
| WY | Jonah Bank | `jonah-bank-of-wyoming` |
| WY | UniWyo FCU | `uniwyo-federal-credit-union` |
| WY | Meridian Trust FCU | `meridian-trust-federal-credit-union` |
| WY | Blue FCU | `blue-federal-credit-union` |

Plus nationals: Rocket, UWM, Guild, Fairway, PennyMac, VU/MRC, Mountain America FCU, Evergreen MoneySource, etc.

## Deferred

- Full perfect coverage of every ID/MT/WY county  
- Lower-volume regionals without high-confidence directory link  
- Company NMLS inventing where not verified  

## Parallel work

Does not modify New Mexico / West Virginia product slices. Rebuild writes only `idaho/`, `montana/`, and `wyoming/` plus shared national directory rows for these regionals.
