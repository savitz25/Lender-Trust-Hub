# HMDA Illinois · Ohio expansion

**Vintage:** 2025  
**Source:** `data/hmda/by-state/{IL,OH}/`  
**Product slices:**  
- `data/hmda/illinois/`  
- `data/hmda/ohio/`

## Activate / rebuild

```bash
python scripts/process_hmda_national.py year_2025.csv   # if partitions missing
python scripts/build-hmda-il-oh-slices.py
```

## What goes live

| Surface | Behavior |
|---------|----------|
| `/local-lenders/illinois/{county}` | Market panels for major counties |
| `/local-lenders/ohio/{county}` | Market panels for major counties |
| `/lenders/{slug}` | State originations when LEI mapped |
| Analyzer | `il:{county}`, `oh:{county}` prefill options |

## Mapping coverage (deepen pass)

| Metric | Illinois | Ohio |
|--------|----------|------|
| Panel markets (majors) | **32** | **40** |
| High-confidence LEI maps | see slice README after rebuild | see slice README after rebuild |

## Major counties

### Illinois — wave 1 + deepen
**Wave 1:** Cook, DuPage, Will, Lake, Kane, McHenry, Kendall, Madison, Winnebago, St. Clair, Sangamon, Peoria, McLean, Champaign, Tazewell, Rock Island, DeKalb, Kankakee, LaSalle, Macon  

**Deepen:** Grundy, Williamson, Vermilion, Boone, Ogle, Henry, Woodford, Monroe, Macoupin, Whiteside, Knox, Adams  

### Ohio — wave 1 + deepen
**Wave 1:** Franklin, Cuyahoga, Hamilton, Summit, Montgomery, Butler, Stark, Lucas, Lorain, Warren, Delaware, Lake, Clermont, Mahoning, Licking, Medina, Fairfield, Trumbull, Greene, Portage  

**Deepen:** Clark, Wood, Miami, Richland, Union, Geauga, Allen, Wayne, Muskingum, Ashtabula, Columbiana, Pickaway, Hancock, Knox, Erie, Ross, Marion, Tuscarawas, Madison, Sandusky  

## Matching

- Reuse prior product-state curated LEI maps when the LEI has IL or OH activity  
- Precision only — no low-confidence LEI inventing  
- KeyBank linked by LEI identity (avoids Flagstar NMLS collision)  

### Wave 1 curated
| Lender | NMLS | Slug |
|--------|------|------|
| GreenState Credit Union | 1495 | `greenstate-credit-union` |
| CEFCU | 407798 | `cefcu` |
| Old National Bank | 459308 | `old-national-bank` |
| Flat Branch Mortgage | 224149 | `flat-branch-mortgage` |
| Union Savings Bank | 446047 | `union-savings-bank` |
| Wright-Patt Credit Union | 510034 | `wright-patt-credit-union` |
| Ruoff Mortgage | 141868 | `ruoff-mortgage` |
| KeyBank National Association | (LEI identity) | `keybank` |

### Deepen curated
| Lender | NMLS | Slug |
|--------|------|------|
| BMO Bank N.A. | 401052 | `bmo-bank` |
| Wintrust Mortgage (Barrington Bank & Trust) | 449042 | `wintrust-mortgage` |
| Consumers Credit Union (IL) | 692733 | `consumers-credit-union-illinois` |
| WesBanco Bank | 399836 | `wesbanco-bank` |
| First Financial Bank (OH) | 619717 | `first-financial-bank-ohio` |
| Superior Credit Union | 746357 | `superior-credit-union-ohio` |
| KEMBA Financial Credit Union | 292230 | `kemba-financial-credit-union` |
| 7 17 Credit Union | 469483 | `seven-seventeen-credit-union` |

## What improved vs deferred

### Improved
- IL panels expanded beyond Chicago / collar / major downstate metros (32 majors)  
- OH panels expanded beyond Columbus / Cleveland / Cincinnati / Dayton / Akron core (40 majors)  
- Eight additional high-confidence regional lenders with directory hosts + LEI maps  
- Multi-state wiring intact for all **22** live product states  

### Intentionally deferred
- Full 102-county IL / 88-county OH coverage (thin rural panels)  
- Park National Bank, OriginPoint, Figure, Kiavi, First American Bank, Morton Community Bank, Howard Hanna Financial Services — no clean company NMLS + host pairing in this pass  
- Low-confidence LEI inventing  

## Stability

Does not modify existing product-state folders for the other 20 live states.
