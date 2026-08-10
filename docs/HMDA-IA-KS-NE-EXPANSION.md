# HMDA Iowa · Kansas · Nebraska expansion

**Vintage:** 2025  
**Source:** `data/hmda/by-state/{IA,KS,NE}/`  
**Product slices:**  
- `data/hmda/iowa/`  
- `data/hmda/kansas/`  
- `data/hmda/nebraska/`

## Activate / rebuild

```bash
python scripts/process_hmda_national.py year_2025.csv   # if partitions missing
python scripts/build-hmda-ia-ks-ne-slices.py
```

## What goes live

| Surface | Behavior |
|---------|----------|
| `/local-lenders/iowa/{county}` | Market panels for major counties |
| `/local-lenders/kansas/{county}` | Market panels for major counties |
| `/local-lenders/nebraska/{county}` | Market panels for major counties |
| `/lenders/{slug}` | State originations when LEI mapped |
| Analyzer | `ia:{county}`, `ks:{county}`, `ne:{county}` prefill |

## Wave 1 coverage

| Metric | Iowa | Kansas | Nebraska |
|--------|------|--------|----------|
| Panel markets (majors) | **15** | **14** | **14** |
| High-confidence LEI maps | see slice README | see slice README | see slice README |

### Iowa major counties

Polk, Linn, Scott, Johnson, Black Hawk, Woodbury, Dallas, Dubuque, Pottawattamie, Warren, Story, Jasper, Clinton, Muscatine, Bremer

### Kansas major counties

Johnson, Sedgwick, Shawnee, Douglas, Wyandotte, Leavenworth, Butler, Reno, Riley, Miami, Geary, Harvey, Saline, Pottawatomie

### Nebraska major counties

Douglas, Lancaster, Sarpy, Hall, Buffalo, Dodge, Cass, Lincoln, Platte, Saunders, Washington, Madison, Adams, Scotts Bluff

## Matching

- Reuse prior product-state curated LEI maps when the LEI has IA/KS/NE activity  
- Precision only — no low-confidence LEI inventing  
- GLEIF re-identification for high-value nationals where prior maps collided  
- Identity-first directory rows for high-volume Plains regionals  

### Regional LEI-identity maps (examples)

| State | Lender | Slug |
|-------|--------|------|
| IA | GreenState CU | `greenstate-credit-union` |
| IA | Veridian CU | `veridian-credit-union` |
| IA | Hills Bank and Trust | `hills-bank-and-trust` |
| IA | Dupaco Community CU | `dupaco-community-credit-union` |
| IA | Iowa Bankers Mortgage | `iowa-bankers-mortgage` |
| KS | Capitol Federal | `capitol-federal-savings-bank` |
| KS | Credit Union of America | `credit-union-of-america` |
| KS | Meritrust FCU | `meritrust-federal-credit-union` |
| NE | Pinnacle Bank | `pinnacle-bank-nebraska` |
| NE | First National Bank of Omaha | `first-national-bank-of-omaha` |
| NE | West Gate Bank | `west-gate-bank` |
| NE | Union Bank and Trust | `union-bank-and-trust-nebraska` |
| NE | Centris FCU | `centris-federal-credit-union` |

Plus nationals: Rocket, UWM, Fairway, PennyMac, VU/MRC, Guild, CommunityAmerica (KS), Flat Branch, Commerce Bank, Arvest, etc.

## Deferred

- Full perfect coverage of every IA/KS/NE county  
- Lower-volume regionals without high-confidence directory link  
- Company NMLS inventing where not verified  

## Parallel work

Does not modify Arkansas / Mississippi / Oklahoma product slices. Rebuild writes only `iowa/`, `kansas/`, and `nebraska/` plus shared national directory rows for these regionals.
