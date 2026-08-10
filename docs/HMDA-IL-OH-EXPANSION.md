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
| `/local-lenders/illinois/{county}` | Market panels for wave-1 major counties |
| `/local-lenders/ohio/{county}` | Market panels for wave-1 major counties |
| `/lenders/{slug}` | State originations when LEI mapped |
| Analyzer | `il:{county}`, `oh:{county}` prefill options |

## Major counties (wave 1)

### Illinois (20)
Cook, DuPage, Will, Lake, Kane, McHenry, Kendall, Madison, Winnebago, St. Clair, Sangamon, Peoria, McLean, Champaign, Tazewell, Rock Island, DeKalb, Kankakee, LaSalle, Macon

### Ohio (20)
Franklin, Cuyahoga, Hamilton, Summit, Montgomery, Butler, Stark, Lucas, Lorain, Warren, Delaware, Lake, Clermont, Mahoning, Licking, Medina, Fairfield, Trumbull, Greene, Portage

## Matching

- Reuse prior product-state curated LEI maps when the LEI has IL or OH activity  
- Precision only — no low-confidence LEI inventing  

### IL / OH curated (GLEIF + published company NMLS or LEI identity)

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

Huntington, Rocket, UWM, Chase, PNC, Guaranteed Rate, Eagle Home Mortgage, and other multi-state lenders reuse prior maps.

**Note:** KeyBank is linked by LEI identity rather than company NMLS to avoid collision with Flagstar’s published NMLS id in product maps.

## Intentionally deferred

- Full 102-county IL / 88-county OH coverage  
- BMO Bank N.A., Barrington Bank (Wintrust), First American Bank, Park National, WesBanco, First Financial, OriginPoint, Figure, Kiavi, Kemba FCU, Seven Seventeen CU — no clean company NMLS + directory host pairing in this pass  
- Low-confidence LEI inventing  

## Stability

Does not modify existing product-state folders for the other 20 live states. Multi-state wiring remains intact for all **22** active product states after this activation.
