# North Carolina HMDA deepen (high-volume phase)

**Date:** 2026-08-10  
**Repo:** lender-trust-hub  
**Scope:** North Carolina only (nationwide 50+DC footprint unchanged)

## Goal

Make North Carolina feel deeper than a first-pass major-county launch: more high-volume counties with live market intelligence, more high-value lenders resolving HMDA evidence cleanly, quality over forced matches.

## What improved

### 1. County market intelligence

`HMDA_STATE_CONFIGS.NC.majorCountySlugs` expanded from **30** to **40** panel-ready markets (volume-ranked), including next-band counties beyond Wake / Mecklenburg / Guilford / Forsyth / Durham:

| Band | Counties |
|------|----------|
| Core | Wake, Mecklenburg, Guilford, Forsyth, Durham, Cumberland, Union, Brunswick, Johnston, Cabarrus |
| Metro next | Onslow, Gaston, New Hanover, Iredell, Buncombe, Harnett, Catawba, Alamance, Davidson, Rowan |
| Extended | Pitt, Moore, Randolph, Henderson, Craven, Lincoln, Orange, Wayne, Pender, Franklin |
| Deepen band | **Carteret, Cleveland, Nash, Rockingham, Hoke, Chatham, Burke, Caldwell, Stanly, Dare** |

Product slice rebuilt from `data/hmda/by-state/NC/`:

- `county_market_summary_nc.csv` — named high-volume markets
- `lender_activity_by_county_nc.csv` — lender×county rows for majors
- `lender_state_summary_nc.csv` — GLEIF name enrichment where blank

### 2. Lender mapping quality (high-confidence only)

| Metric | Before | After |
|--------|--------|-------|
| LEI→slug maps | 63 | **232** |
| Top-20 mapped | 14/20 | **20/20** |
| Top-50 mapped | 29/50 | **43/50** |
| Orphan directory slugs | n/a | **0** |

**Identity repair:** Early FL-reuse maps had swapped LEI identities (e.g. DHI labeled as CrossCountry, Movement labeled as Cardinal, Bank of America labeled as Guaranteed Rate, Freedom/Guild/Fairway swaps). Deepen applies **GLEIF-aligned re-identification**.

**Newly linked high-value NC / multi-state lenders** (examples):

| Lender | Slug | Notes |
|--------|------|--------|
| State Employees' Credit Union | `state-employees-credit-union-nc` | Top NC originator (~27.5k); NMLS 430055 |
| Truliant Federal Credit Union | `truliant-federal-credit-union` | NMLS 411251 |
| Coastal Federal Credit Union | `coastal-federal-credit-union` | NMLS 619449 |
| First-Citizens Bank | `first-citizens-bank` | Prior multi-state map |
| Atlantic Bay Mortgage | `atlantic-bay-mortgage-charleston` | Strong NC volume |
| First National Bank of PA | `first-national-bank-of-pennsylvania` | |
| NVR Mortgage, TowneBank, Alcova, United Community, Prosperity Home Mortgage, Pinnacle Bank, NFM Lending | existing hosts | |
| Movement / Cardinal | corrected LEIs | Movement → Charlotte host; Cardinal separate |

### 3. Directory hosts added

Thin national catalog hosts (research positioning, sourced identity only):

- `state-employees-credit-union-nc`
- `truliant-federal-credit-union`
- `coastal-federal-credit-union`

### 4. Architecture

- Reuses existing NC product folder + multi-state load/query path (`fileSuffix: _nc`)
- Rebuild: `python scripts/build-hmda-north-carolina-deepen.py`
- Coverage: `data/hmda/north-carolina/coverage_summary.json`

## Intentionally deferred

No low-confidence LEI inventing. Notable unmapped / thin cases:

- American Security Mortgage Corp.
- Allegacy Federal Credit Union
- First Bank (ambiguous name — not force-linked)
- Southern Bank and Trust Company
- Figure Lending
- Highlands Residential Mortgage
- The Fidelity Bank, HomeTrust Bank
- Jet HomeLoans, Cornerstone Capital Bank, Primis Mortgage, Skyla FCU
- Full coverage of all 100 North Carolina counties

## Multi-state stability

- Other state product folders untouched
- Mapping reuse pulls from prior product states; curated NC rows override on conflict
- Nationwide QA expected green on orphan slug resolution

## Success criteria checklist

| Criterion | Status |
|-----------|--------|
| NC deeper than first-pass launch | Yes — 40 majors, repaired identities |
| More high-volume counties with HMDA panels | Yes (+10 deepen-band) |
| More high-value NC lenders resolve evidence | Yes — 232 maps, top-20 20/20 |
| Nationwide footprint intact | Yes (NC-only product edits) |
| Data quality high | Yes — exact/high only, 0 orphans |
