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

## Coverage (after deepen)

| Metric | Wisconsin | Minnesota |
|--------|-----------|-----------|
| Panel markets (majors) | **40** | **36** |
| High-confidence LEI maps | see slice README after rebuild | see slice README after rebuild |
| Lender–county activity (majors) | see rebuild | see rebuild |

### Wisconsin major counties

**Wave 1:** Milwaukee, Dane, Waukesha, Brown, Outagamie, Racine, Rock, Winnebago, Kenosha, Washington, Marathon, Sheboygan, La Crosse, Walworth, St. Croix, Fond du Lac, Ozaukee, Eau Claire, Dodge, Manitowoc  

**Deepen:** Jefferson, Columbia, Sauk, Calumet, Chippewa, Wood, Waupaca, Polk, Portage, Oconto, Barron, Marinette, Shawano, Douglas, Oneida, Monroe, Door, Pierce, Green, Dunn  

### Minnesota major counties

**Wave 1:** Hennepin, Dakota, Ramsey, Anoka, Washington, Wright, St. Louis, Scott, Olmsted, Stearns, Carver, Sherburne, Crow Wing, Chisago, Clay, Rice, Blue Earth, Otter Tail, Isanti, Winona  

**Deepen:** Goodhue, Itasca, Carlton, Benton, Mille Lacs, Douglas, McLeod, Cass, Becker, Mower, Pine, Kandiyohi, Steele, Le Sueur, Morrison, Nicollet  

## Matching

- Reuse prior product-state curated LEI maps when the LEI has WI or MN activity  
- Precision only — no low-confidence LEI inventing  
- Directory profiles for high-volume regionals live in `lib/mortgage/nationalHmdaLenders.ts` (identity-first; no invented ratings)  

### Verified NMLS (examples)

| Lender | NMLS | Slug |
|--------|------|------|
| Landmark Credit Union | 401043 | `landmark-credit-union` |
| TruStone Financial Credit Union | 523134 | `trustone-financial-credit-union` |

### LEI-identity regionals (high-volume; no invented NMLS)

**Wisconsin:** Summit CU, UW Credit Union, Associated Bank, CoVantage CU, Community First CU (Appleton), Educators CU, Johnson Bank, Royal CU, Fox Communities CU, Nicolet National Bank, Capital CU, Bank First N.A., Altra FCU, Westconsin CU  

**Minnesota:** Bell Bank, Affinity Plus FCU, Blaze CU, Wings Financial CU, Alerus Financial (+ shared Royal CU / Altra where active)  

Plus nationals: Fairway, PennyMac, Guaranteed Rate, loanDepot, CrossCountry, Guild, Veterans United (MRC), Lennar, Freedom, Huntington, Old National, BMO, Academy, Wintrust family, UWM, Rocket, etc.

## What improved vs deferred

### Improved
- Doubled WI panel set (20 → 40) and expanded MN (20 → 36)  
- High-volume local/regional CUs and banks now resolve LEI → directory slug → evidence panels  
- Cleaner top-of-market WI/MN evidence ranking  

### Deferred
- Perfect coverage of every WI/MN county  
- Lower-volume regionals without high-confidence LEI→directory link  
- Company NMLS inventing where not verified  

## Parallel work

Does not modify other product-state slices beyond WI/MN rebuild outputs and shared national directory rows for WI/MN regionals.
