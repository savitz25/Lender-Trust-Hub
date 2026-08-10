# HMDA Wisconsin · Minnesota expansion

**Vintage:** 2025  
**Source:** `data/hmda/by-state/{WI,MN}/`  
**Product slices:**  
- `data/hmda/wisconsin/`  
- `data/hmda/minnesota/`

## Activate / rebuild

```bash
python scripts/process_hmda_national.py year_2025.csv   # if partitions missing
python scripts/build-hmda-wi-mn-slices.py
```

## What goes live

| Surface | Behavior |
|---------|----------|
| `/local-lenders/wisconsin/{county}` | Market panels for major counties |
| `/local-lenders/minnesota/{county}` | Market panels for major counties |
| `/lenders/{slug}` | State originations when LEI mapped |
| Analyzer | `wi:{county}`, `mn:{county}` prefill options |

## Wave 1 coverage

| Metric | Wisconsin | Minnesota |
|--------|-----------|-----------|
| Panel markets (majors) | **20** | **20** |
| High-confidence LEI maps | see slice README after rebuild | see slice README after rebuild |

### Wisconsin major counties

Milwaukee, Dane, Waukesha, Brown, Outagamie, Racine, Rock, Winnebago, Kenosha, Washington, Marathon, Sheboygan, La Crosse, Walworth, St. Croix, Fond du Lac, Ozaukee, Eau Claire, Dodge, Manitowoc

### Minnesota major counties

Hennepin, Dakota, Ramsey, Anoka, Washington, Wright, St. Louis, Scott, Olmsted, Stearns, Carver, Sherburne, Crow Wing, Chisago, Clay, Rice, Blue Earth, Otter Tail, Isanti, Winona

## Matching

- Reuse prior product-state curated LEI maps when the LEI has WI or MN activity  
- Precision only — no low-confidence LEI inventing  
- **No WI/MN-only directory profiles** in this pass; regional credit unions (Summit CU, UWCU, Landmark, Bell Bank, Affinity Plus, etc.) remain unmapped until high-confidence directory slugs exist  

### WI/MN curated (GLEIF-reidentified nationals → existing directory slugs)

| Lender | NMLS | Slug |
|--------|------|------|
| Fairway Independent | 2909 | `fairway-mortgage-augusta-sheppard` |
| PennyMac Loan Services | 35953 | `pennymac` |
| Guaranteed Rate | 2611 | `guaranteed-rate` |
| loanDepot.com | 174457 | `loandepot` |
| CrossCountry Mortgage | 3029 | `crosscountry-mortgage-metrowest` |
| Guild Mortgage | 3274 | `guild-mortgage-metrowest` |
| Veterans United (MRC) | 1907 | `veterans-united-west-valley` |
| Lennar Mortgage | 1058 | `lennar-mortgage-queen-creek` |
| Freedom Mortgage | 2767 | `freedom-mortgage` |
| Nationstar / Mr. Cooper | 2104 | `mr-cooper` |
| Huntington National Bank | 402436 | `huntington-national-bank` |
| Old National Bank | 459308 | `old-national-bank` |
| BMO Bank | 401052 | `bmo-bank` |
| Academy Mortgage | 3113 | `academy-mortgage` |
| Barrington / Wintrust family | 449042 | `wintrust-mortgage` |

Plus reuse of UWM, Rocket, U.S. Bank, Wells Fargo, Chase, Newrez, etc. from prior maps.

## Deferred

- Full perfect coverage of every WI/MN county  
- Mapping regional CUs/banks without directory profiles (Summit, UWCU, Landmark, Associated Bank, Bell Bank, TruStone, Affinity Plus, Wings, etc.)  
- Activating additional states in this pass  

## Parallel work

Does not modify Colorado product slices. Rebuild writes only `wisconsin/` and `minnesota/` folders.
