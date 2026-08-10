# Arkansas + Mississippi + Oklahoma HMDA activation

**Date:** 2026-08-10  
**Scope:** Product-ready HMDA evidence for **Arkansas**, **Mississippi**, and **Oklahoma** only.  
**Builder:** `python scripts/build-hmda-ar-ms-ok-slices.py`  
**Sources:** `data/hmda/by-state/{AR,MS,OK}/`

## Product outputs

| State | Folder | Majors (wave 1) | Mappings | Market rows |
|-------|--------|-----------------|----------|-------------|
| Arkansas | `data/hmda/arkansas/` | Benton, Pulaski, Washington, Saline, Faulkner, Craighead, Sebastian, Garland, Lonoke, White, Crawford, Pope, Baxter, Greene, Boone, Jefferson, Crittenden, Independence | **147** high-confidence | 19 |
| Mississippi | `data/hmda/mississippi/` | DeSoto, Harrison, Rankin, Hinds, Jackson, Madison, Lee, Lafayette, Lamar, Forrest, Jones, Hancock, Pearl River, Lowndes, Lauderdale, Marshall, Oktibbeha, Warren | **140** high-confidence | 18 |
| Oklahoma | `data/hmda/oklahoma/` | Oklahoma, Tulsa, Cleveland, Canadian, Wagoner, Comanche, Rogers, Logan, Pottawatomie, Creek, Grady, McClain, Payne, Muskogee, Garfield, Washington, Bryan, Carter | **151** high-confidence | 26 |

Each folder includes county market summary, lender activity by major market, lender state summary, LEI mapping candidates, and `lei_to_nmls_mapping.csv`.

Analyzer prefixes: `ar:{county}`, `ms:{county}`, `ok:{county}`.  
County links: `/local-lenders/arkansas/...`, `/local-lenders/mississippi/...`, `/local-lenders/oklahoma/...`.

## Matching rules

1. **Reuse** prior product-state LEI→directory maps when the LEI has AR/MS/OK activity  
2. **National LEI re-identify** (UWM, Rocket, Regions, Guild, CrossCountry, Freedom, Trustmark, Cadence, Renasant, BOK, Arvest, Flat Branch, Gateway, etc.)  
3. **AR regionals (GLEIF + public NMLS):** Arkansas FCU (418494), FirstTrust Home Loans (75271), First Security Bank (414458), Centennial Bank (466091), Bank OZK (464037), Simmons Bank (484633)  
4. **MS regionals:** Community Bank of Mississippi (402411), BankPlus (431487)  
5. **OK regionals:** BancFirst (441224), MidFirst Bank (619047), TTCU (401680), First United Bank (LEI identity)

**Not mapped this pass** (precision-first): Keesler FCU, Tinker FCU, Highlands Residential Mortgage, Associated Mortgage Corporation, Stride Bank, Great Plains National Bank, and other regionals without verified NMLS + host.

## Multi-state product wiring

- `lib/hmda/states.ts` — `AR` / `MS` / `OK` configs + active codes (**42** total with IA/KS/NE)  
- Loaders, queries, analyzer prefixes  
- Identity hosts in `lib/mortgage/nationalHmdaLenders.ts`  
- County panels via existing `HmdaCountyMarketPanel`  
- Lender panels: primary = highest originations among product states

## Parallel work

- **Iowa / Kansas / Nebraska** may land in the same window; this activation only adds AR/MS/OK folders and shared wiring keys  
- Does not rewrite IA/KS/NE slice data

## Rebuild

```bash
python scripts/build-hmda-ar-ms-ok-slices.py
```

## Success criteria

| Criterion | Status |
|-----------|--------|
| AR + MS + OK product slices | Pass |
| Major counties with real volume | Pass |
| Matched lenders show state activity | Pass |
| Existing states unchanged | Pass |
| Analyzer prefixes `ar:` / `ms:` / `ok:` | Pass |
