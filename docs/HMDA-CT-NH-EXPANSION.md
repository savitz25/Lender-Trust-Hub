# HMDA Connecticut · New Hampshire expansion

**Vintage:** 2025  
**Source:** `data/hmda/by-state/{CT,NH}/`  
**Product slices:**  
- `data/hmda/connecticut/`  
- `data/hmda/new-hampshire/`

## Activate / rebuild

```bash
python scripts/process_hmda_national.py year_2025.csv   # if partitions missing
python scripts/build-hmda-ct-nh-slices.py
```

## What goes live

| Surface | Behavior |
|---------|----------|
| `/local-lenders/connecticut/{region}` | Market panels for planning-region county-equivalents |
| `/local-lenders/new-hampshire/{county}` | Market panels for NH counties |
| `/lenders/{slug}` | State originations when LEI mapped |
| Analyzer | `ct:`, `nh:` prefill options |

## Geography note (Connecticut)

HMDA for Connecticut uses **Census planning-region county-equivalents** (FIPS `09110`–`09190`), not the legacy eight county codes (Fairfield, Hartford, …). Product slugs follow planning-region names, e.g.:

| FIPS | Panel name / slug | Rough legacy overlap |
|------|-------------------|----------------------|
| 09110 | Capitol / `capitol` | Hartford area |
| 09190 | Western Connecticut / `western-connecticut` | Fairfield area |
| 09170 | South Central Connecticut / `south-central-connecticut` | New Haven area |
| 09180 | Southeastern Connecticut / `southeastern-connecticut` | New London area |
| 09120 | Greater Bridgeport / `greater-bridgeport` | Bridgeport area |
| 09140 | Naugatuck Valley | Waterbury area |
| 09130 | Lower Connecticut River Valley | Middlesex-area river towns |
| 09150 | Northeastern Connecticut | Windham-area |
| 09160 | Northwest Hills | Litchfield-area |

## Major counties / regions

### Connecticut (all 9 planning regions)
Capitol, Western Connecticut, South Central Connecticut, Naugatuck Valley, Southeastern Connecticut, Greater Bridgeport, Lower Connecticut River Valley, Northeastern Connecticut, Northwest Hills

### New Hampshire (all 10 counties)
Hillsborough, Rockingham, Merrimack, Strafford, Grafton, Belknap, Carroll, Cheshire, Sullivan, Coos

## Matching

- Reuse prior product-state curated LEI maps when LEI has state activity  
- CT/NH curated (GLEIF + published company NMLS):
  - Liberty Bank (459028)
  - First World Mortgage (2643)
  - Service Credit Union (491588)
  - St. Mary's Bank (690869)
- Precision only  

## Stability

Does not modify existing product-state folders (FL–ME / RI–VT–ME set).
