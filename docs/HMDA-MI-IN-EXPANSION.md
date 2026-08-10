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
| `/local-lenders/michigan/{county}` | Market panels for major counties |
| `/local-lenders/indiana/{county}` | Market panels for major counties |
| `/lenders/{slug}` | State originations when LEI mapped |
| Analyzer | `mi:{county}`, `in:{county}` prefill options |

## Mapping coverage (deepen pass)

| Metric | Michigan | Indiana |
|--------|----------|---------|
| Panel markets (majors) | **35** | **35** |
| High-confidence LEI maps | see slice README after rebuild | see slice README after rebuild |

## Major counties

### Michigan — wave 1 + deepen
**Wave 1:** Wayne, Oakland, Macomb, Kent, Genesee, Ottawa, Washtenaw, Kalamazoo, Livingston, Ingham, Muskegon, St. Clair, Monroe, Berrien, Jackson, Saginaw, Allegan, Calhoun, Grand Traverse, Eaton  

**Deepen:** Lenawee, Lapeer, Bay, Van Buren, Clinton, Barry, Midland, Shiawassee, Ionia, St. Joseph, Cass, Isabella, Mecosta, Montcalm, Newaygo  

### Indiana — wave 1 + deepen
**Wave 1:** Marion, Hamilton, Lake, Allen, St. Joseph, Hendricks, Johnson, Elkhart, Porter, Vanderburgh, Tippecanoe, Clark, Madison, Hancock, Boone, Monroe, Delaware, LaPorte, Morgan, Floyd  

**Deepen:** Howard, Kosciusko, Bartholomew, Vigo, Warrick, Dearborn, Wayne, DeKalb, Shelby, Grant, Noble, Lawrence, Harrison, Henry, Marshall  

## Matching

- Reuse prior product-state curated LEI maps when the LEI has MI or IN activity  
- Precision only — no low-confidence LEI inventing  
- First Merchants linked by LEI identity  

### Wave 1 curated
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

### Deepen curated
| Lender | NMLS | Slug |
|--------|------|------|
| MSGCU | 423037 | `msgcu` |
| Dart Bank | 406384 | `dart-bank` |
| Mercantile Bank (MI) | 419813 | `mercantile-bank-michigan` |
| Staunton Financial | 140012 | `staunton-financial` |
| Indiana Members Credit Union | 402492 | `indiana-members-credit-union` |
| Everwise Credit Union | 686706 | `everwise-credit-union` |
| Centra Credit Union | 409733 | `centra-credit-union` |
| Liberty Federal Credit Union | 518136 | `liberty-federal-credit-union` |

## What improved vs deferred

### Improved
- MI panels expanded beyond Detroit / Grand Rapids / first-wave mid-state set (**35** majors)  
- IN panels expanded beyond Indianapolis / NW IN / Fort Wayne core (**35** majors)  
- Eight additional high-confidence regional lenders with directory hosts + LEI maps  
- Multi-state wiring intact for all **24** live product states  

### Intentionally deferred
- Full 83-county MI / 92-county IN coverage (thin rural panels)  
- Independent Bank (MI), Consumers CU (MI), Credit Union ONE, Mortgage Center, Horizon Bank — no clean company NMLS + host pairing in this pass  
- Low-confidence LEI inventing  

## Stability

Does not modify existing product-state folders for the other 22 live states.
