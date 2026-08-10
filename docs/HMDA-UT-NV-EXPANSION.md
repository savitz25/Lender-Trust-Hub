# Utah + Nevada HMDA activation

**Date:** 2026-08-10  
**Scope:** Product-ready HMDA evidence for **Utah** and **Nevada** only (does not modify MO/KY or other live states).  
**Builder:** `python scripts/build-hmda-ut-nv-slices.py`  
**Sources:** `data/hmda/by-state/UT/`, `data/hmda/by-state/NV/`

## Product outputs

| State | Folder | Majors (wave 1) | Mappings | County market rows |
|-------|--------|-----------------|----------|--------------------|
| Utah | `data/hmda/utah/` | Salt Lake, Utah, Davis, Weber, Washington, Cache, Tooele, Iron, Box Elder, Wasatch, Summit, Uintah, Sanpete, Sevier, Carbon, Morgan | ~125 high-confidence | 29 |
| Nevada | `data/hmda/nevada/` | Clark, Washoe, Lyon, Nye, Douglas, Elko, Carson City, Churchill, Humboldt | ~116 high-confidence | 17 |

Each folder includes:

- `county_market_summary_{ut|nv}.csv`
- `lender_activity_by_county_{ut|nv}.csv` (major markets only)
- `lender_state_summary_{ut|nv}.csv`
- `lei_mapping_candidates_{ut|nv}.csv`
- `lei_to_nmls_mapping.csv`
- `README.md`

## Matching rules

1. **Reuse** prior product-state LEI→directory maps when the LEI has UT/NV activity  
2. **Curated re-identify** for national LEIs (UWM, Rocket, Guild, CrossCountry, Freedom, loanDepot, PennyMac, etc.) so corrupted prior rows cannot mislabel  
3. **UT/NV regionals (GLEIF + public NMLS)** — precision only:

| Institution | NMLS | Slug |
|-------------|------|------|
| America First FCU | 412819 | `america-first-federal-credit-union` |
| Mountain America FCU | 462815 | `mountain-america-federal-credit-union` |
| Intercap Lending | 190465 | `intercap-lending` |
| Goldenwest FCU | 440574 | `goldenwest-federal-credit-union` |
| First Colony Mortgage | 3112 | `first-colony-mortgage` |
| SecurityNational Mortgage | 3116 | `securitynational-mortgage` |
| Utah Community CU | 407653 | `utah-community-credit-union` |
| RanLife | 3151 | `ranlife` |
| Bank of Utah | 422914 | `bank-of-utah` |
| Deseret First CU | 403075 | `deseret-first-credit-union` |
| Utah First CU | 446035 | `utah-first-credit-union` |
| Chartway FCU | 423149 | `chartway-federal-credit-union` |
| Security Home Mortgage | 178787 | `security-home-mortgage` |
| Provident Funding | 3821 | `provident-funding` |
| Greater Nevada CU | 279738 | `greater-nevada-credit-union` |

Plus directory reuse: Academy Mortgage, Primary Residential Mortgage, Zions Bank, Kind Lending, HomeAmerican, APM, etc.

**Not mapped this pass** (precision-first): Cyprus FCU, Canyon View, Canopy Mortgage, One Nevada CU, KBHS Home Loans, Silver State Schools Service Co., United FCU, State Bank of Southern Utah, My Move Mortgage — pending verified NMLS / directory hosts.

## Multi-state product wiring

- `lib/hmda/states.ts` — `UT` / `NV` configs + active codes (32 total with MO/KY)  
- `lib/hmda/load.ts` — `utah_originations` / `nevada_originations` fallbacks  
- `lib/hmda/queries.ts` + `index.ts` — major county exports  
- Analyzer prefixes: `ut:{county}`, `nv:{county}` in `county-option.ts` / `options.ts`  
- Identity hosts in `lib/mortgage/nationalHmdaLenders.ts`  
- County panels: `/local-lenders/utah/...`, `/local-lenders/nevada/...` via existing `HmdaCountyMarketPanel`  
- Lender panels: primary = highest originations among product states; labels use state name (e.g. “Utah originations”)

## Parallel work

- **Missouri / Kentucky** already live on `main` (`feat(hmda): activate Missouri and Kentucky evidence`)  
- This activation only adds UT/NV folders and shared wiring; does not rewrite MO/KY slices  

## Rebuild

```bash
python scripts/build-hmda-ut-nv-slices.py
```

## Success criteria

| Criterion | Status |
|-----------|--------|
| UT + NV product slices | Pass |
| Major counties with real volume | Pass (Salt Lake / Clark top markets named) |
| Matched lenders show state activity | Pass (regionals + nationals) |
| Existing states unchanged | Pass (MO/KY/other folders not rebuilt) |
| Analyzer prefixes `ut:` / `nv:` | Pass |
