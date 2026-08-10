# HMDA Michigan · Indiana expansion

**Vintage:** 2025  
**Source:** `data/hmda/by-state/{MI,IN}/`  
**Product slices:**  
- `data/hmda/michigan/`  
- `data/hmda/indiana/`

## Activate / rebuild

```bash
python scripts/process_hmda_national.py year_2025.csv   # if partitions missing
python scripts/build-hmda-mi-in-slices.py
```

## What goes live

| Surface | Behavior |
|---------|----------|
| `/local-lenders/michigan/{county}` | Market panels for wave-1 major counties |
| `/local-lenders/indiana/{county}` | Market panels for wave-1 major counties |
| `/lenders/{slug}` | State originations when LEI mapped |
| Analyzer | `mi:{county}`, `in:{county}` prefill options |

## Major counties (wave 1)

### Michigan (20)
Wayne, Oakland, Macomb, Kent, Genesee, Ottawa, Washtenaw, Kalamazoo, Livingston, Ingham, Muskegon, St. Clair, Monroe, Berrien, Jackson, Saginaw, Allegan, Calhoun, Grand Traverse, Eaton

### Indiana (20)
Marion, Hamilton, Lake, Allen, St. Joseph, Hendricks, Johnson, Elkhart, Porter, Vanderburgh, Tippecanoe, Clark, Madison, Hancock, Boone, Monroe, Delaware, LaPorte, Morgan, Floyd

## Matching

- Reuse prior product-state curated LEI maps when the LEI has MI or IN activity  
- Precision only — no low-confidence LEI inventing  

### MI / IN curated (GLEIF + published company NMLS or LEI identity)

| Lender | NMLS | Slug |
|--------|------|------|
| Lake Michigan Credit Union | 442967 | `lake-michigan-credit-union` |
| Mortgage 1 | 129386 | `mortgage-1` |
| DFCU Financial | 409709 | `dfcu-financial` |
| Genisys Credit Union | 409008 | `genisys-credit-union` |
| MSU Federal Credit Union | 405297 | `msufcu` |
| First Merchants Bank | (LEI identity) | `first-merchants-bank` |
| GVC Mortgage | 2334 | `gvc-mortgage` |
| 3Rivers Federal Credit Union | 556303 | `three-rivers-federal-credit-union` |
| 1st Source Bank | 645641 | `first-source-bank` |
| German American Bank | 446859 | `german-american-bank` |
| Centier Bank | 408076 | `centier-bank` |
| Lake City Bank | 431669 | `lake-city-bank` |

Rocket, UWM, Huntington, Flagstar, Ruoff, Old National, First Financial (OH), and other multi-state lenders reuse prior maps.

**Note:** First Merchants is linked by LEI identity rather than inventing a company NMLS.

## Intentionally deferred

- Full 83-county MI / 92-county IN coverage  
- Independent Bank (MI), MSGCU, Consumers CU (MI), Mercantile Bank, Horizon Bank, Indiana Members CU, Everwise, Centra — no clean company NMLS + host pairing in this pass  
- Low-confidence LEI inventing  

## Stability

Does not modify existing product-state folders for the other 22 live states. Multi-state wiring remains intact for all **24** active product states after this activation.
