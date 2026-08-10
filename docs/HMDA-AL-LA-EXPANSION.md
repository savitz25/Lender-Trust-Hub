# Alabama + Louisiana HMDA activation

**Date:** 2026-08-10  
**Scope:** Product-ready HMDA evidence for **Alabama** and **Louisiana** only.  
**Builder:** `python scripts/build-hmda-al-la-slices.py`  
**Sources:** `data/hmda/by-state/AL/`, `data/hmda/by-state/LA/`

## Product outputs

| State | Folder | Majors (wave 1) | Mappings | Market rows |
|-------|--------|-----------------|----------|-------------|
| Alabama | `data/hmda/alabama/` | Jefferson, Madison, Baldwin, Mobile, Shelby, Lee, Tuscaloosa, Montgomery, Limestone, Morgan, St. Clair, Houston, Elmore, Lauderdale, Marshall, Calhoun, Etowah, Cullman, Autauga, Coffee | **170** high-confidence | 30 |
| Louisiana | `data/hmda/louisiana/` | East Baton Rouge, St. Tammany, Jefferson, Lafayette, Orleans, Caddo, Livingston, Calcasieu, Ascension, Bossier, Ouachita, Tangipahoa, Rapides, Terrebonne, Lafourche, St. Landry, St. Charles, Vermilion | **124** high-confidence | 27 |

Each folder includes county/parish market summary, lender activity by major market, lender state summary, LEI mapping candidates, and `lei_to_nmls_mapping.csv`.

Louisiana parish names are stored in the `county_name` field (HMDA convention) and slugify cleanly for URLs such as `/local-lenders/louisiana/east-baton-rouge` and `/local-lenders/louisiana/st-tammany`. Analyzer prefixes: `al:{county}`, `la:{parish}`.

## Matching rules

1. **Reuse** prior product-state LEI→directory maps when the LEI has AL/LA activity  
2. **National LEI re-identify** (UWM, Rocket, Regions, Guild, CrossCountry, Freedom, Movement, etc.) so corrupted prior rows cannot mislabel  
3. **AL regionals (GLEIF + public NMLS)** — precision only:

| Institution | NMLS | Slug |
|-------------|------|------|
| Redstone FCU | 403363 | `redstone-federal-credit-union` |
| Trustmark Bank | 449605 | `trustmark-bank` |
| America's First FCU | 403456 | `americas-first-federal-credit-union` |
| Renasant Bank | 402669 | `renasant-bank` |
| River Bank & Trust | 405629 | `river-bank-and-trust` |
| MAX Credit Union | 410580 | `max-credit-union` |
| ServisFirst Bank | 556357 | `servisfirst-bank` |

4. **LA regionals (GLEIF + public NMLS)**:

| Institution | NMLS | Slug |
|-------------|------|------|
| Hancock Whitney Bank | 454781 | `hancock-whitney-bank` |
| GMFS LLC | 64997 | `gmfs-mortgage` |
| DSLD Mortgage | 120308 | `dsld-mortgage` |
| Eustis Mortgage | 70345 | `eustis-mortgage` |
| Assurance Financial | 70876 | `assurance-financial` |
| Fidelity Bank (LA) | 488639 | `fidelity-bank-louisiana` |
| EFCU Financial | 409483 | `efcu-financial` |

**Not mapped this pass** (precision-first): Avadian CU, Bank Independent, All In FCU, SouthPoint Bank, Canopy Mortgage, Gulf Coast Bank & Trust, Red River Bank, b1BANK, Origin Bank, Standard Mortgage, Barksdale FCU, and other regionals pending verified NMLS + host.

## Multi-state product wiring

- `lib/hmda/states.ts` — `AL` / `LA` configs + active codes (**36** total with OR/WA)  
- Loaders, queries, analyzer prefixes  
- Identity hosts in `lib/mortgage/nationalHmdaLenders.ts`  
- County/parish panels via existing `HmdaCountyMarketPanel`  
- Lender panels: primary = highest originations among product states; labels use state name

## Parallel work

- **Oregon / Washington** may land in the same window; this activation only adds AL/LA folders and shared wiring keys  
- Does not rewrite OR/WA slice data

## Rebuild

```bash
python scripts/build-hmda-al-la-slices.py
```

## Success criteria

| Criterion | Status |
|-----------|--------|
| AL + LA product slices | Pass |
| Major counties/parishes with real volume | Pass |
| Matched lenders show state activity | Pass |
| Existing states unchanged | Pass (other product folders not rebuilt) |
| Analyzer prefixes `al:` / `la:` | Pass |
