# Texas HMDA deepen (high-volume phase)

**Date:** 2026-08-10  
**Repo:** lender-trust-hub  
**Scope:** Texas only (nationwide 50+DC footprint unchanged)

## Goal

Make Texas feel deeper than a first-pass major-county launch: more high-volume counties with live market intelligence, more high-value lenders resolving HMDA evidence cleanly, quality over forced matches.

## What improved

### 1. County market intelligence

`HMDA_STATE_CONFIGS.TX.majorCountySlugs` expanded from **~20** to **38** panel-ready markets (volume-ranked), including next-band metros beyond Harris / Dallas / Tarrant / Travis / Bexar:

| Band | Counties |
|------|----------|
| Core | Harris, Bexar, Tarrant, Collin, Dallas, Denton, Travis, Montgomery, Fort Bend, Williamson |
| Next | El Paso, Bell, Hidalgo, Brazoria, Galveston, Hays, Lubbock, Ellis, Kaufman, Nueces |
| Extended | Guadalupe, Comal, Johnson, Parker, Smith, McLennan, Midland, Cameron, Grayson, Brazos, Rockwall, Taylor, Jefferson, Ector, Webb, Bastrop, Liberty, Wichita |

Product slice rebuilt from `data/hmda/by-state/TX/`:

- `county_market_summary_tx.csv` — named high-volume markets
- `lender_activity_by_county_tx.csv` — lender×county rows for majors only
- `lender_state_summary_tx.csv` — GLEIF name enrichment where blank

### 2. Lender mapping quality (high-confidence only)

| Metric | Before | After |
|--------|--------|-------|
| LEI→slug maps | 47 | **209** |
| Top-20 mapped | 18/20 | **19/20** |
| Top-50 mapped | 28/50 | **37/50** |
| Orphan directory slugs | n/a | **0** |

**Identity repair:** Early FL-reuse maps had several swapped LEI identities (e.g. DHI vs CrossCountry, Lennar vs loanDepot, Guild vs Ally, Fairway vs PrimeLending, Freedom vs CrossCountry). Deepen pass applies **GLEIF-aligned re-identification** so evidence panels attach to the correct institution.

**Newly linked high-value TX / multi-state lenders** (examples):

- Randolph-Brooks FCU → `rbfcu-spacex-corridor` (NMLS 583215)
- Security Service FCU → `security-service-federal-credit-union` (NMLS 458903)
- Benchmark Mortgage (Ark-La-Tex) → `benchmark-mortgage`
- Kind Lending, Cadence Bank, Union Home, Gateway First, Plaza, Lower, Provident Funding, Zillow Home Loans, Planet Home Lending, Zions, AmWest, SecurityNational, BOK Financial
- Cardinal Financial (correct LEI) and Movement Mortgage (correct LEI) re-aligned
- TX-facing directory hosts preferred where available (Guild / CrossCountry / Lennar / Veterans United North TX, Bank of America North DFW, Silverton North DFW)

### 3. Architecture

- Reuses existing Texas product folder + multi-state load/query path (`fileSuffix: _tx`, `originationsColumn: texas_originations`)
- Rebuild: `python scripts/build-hmda-texas-deepen.py`
- Coverage metrics: `data/hmda/texas/coverage_summary.json`

## Intentionally deferred

No low-confidence LEI inventing. Notable high-volume TX LEIs **without** confident NMLS+slug linkage in this pass:

- Frost Bank (only unmapped Top-20 LEI; GLEIF identity known)
- Prosperity Bank
- Credit Union of Texas
- First Financial Bank (TX — not OH First Financial)
- First United Bank and Trust Company
- Velocio Mortgage, Highlands Residential Mortgage, SFMC LP
- Cornerstone Capital Bank, SSB
- KBHS Home Loans, Taylor Morrison Home Funding
- Jet HomeLoans, SWBC Mortgage, Network Funding, Rally Credit Union, Amarillo National Bank
- Full county coverage of all 254 Texas counties

## Multi-state stability

- Other state product folders untouched
- Mapping reuse pulls from prior product states but curated TX rows override on conflict
- Nationwide QA should remain green on orphan slug resolution (TX maps resolve in catalog)

## Success criteria checklist

| Criterion | Status |
|-----------|--------|
| Texas deeper than first-pass launch | Yes — 38 majors, repaired identities |
| More high-volume counties with HMDA panels | Yes |
| More high-value TX lenders resolve evidence | Yes — 209 maps, top-50 37/50 |
| Nationwide footprint intact | Yes (TX-only product edits) |
| Data quality high | Yes — exact/high only, 0 orphans |
