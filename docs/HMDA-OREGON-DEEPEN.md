# Oregon HMDA deepen (high-volume phase)

**Date:** 2026-08-10  
**Repo:** lender-trust-hub  
**Scope:** Oregon only (nationwide 50+DC footprint unchanged)

## Goal

Make Oregon feel deeper than a first-pass major-county launch: more high-volume counties with live market intelligence, more high-value lenders resolving HMDA evidence cleanly, quality over forced matches.

## What improved

### 1. County market intelligence

`HMDA_STATE_CONFIGS.OR.majorCountySlugs` expanded from **18** to **27** panel-ready markets:

| Band | Counties |
|------|----------|
| Core | Multnomah, Washington, Clackamas, Lane, Marion, Deschutes |
| Next | Jackson, Linn, Yamhill, Douglas, Polk, Josephine, Umatilla, Benton, Klamath, Coos, Lincoln, Columbia |
| Deepen | **Clatsop, Crook, Tillamook, Jefferson, Union, Wasco, Malheur, Curry, Hood River** |

Product slice rebuilt from `data/hmda/by-state/OR/`.

### 2. Lender mapping quality (high-confidence only)

| Metric | Before | After |
|--------|--------|-------|
| LEI→slug maps | 144 | **180** |
| Top-20 mapped | 18/20 | **19/20** |
| Top-50 mapped | 39/50 | **45/50** |
| Orphan directory slugs | n/a | **0** |

**Identity repair:** GLEIF re-identification (e.g. Lennar LEI no longer mislabeled as loanDepot).

**Newly linked high-value OR lenders:**

| Lender | Slug | NMLS |
|--------|------|------|
| Rivermark Community Credit Union | `rivermark-community-credit-union` | 405464 |
| Unitus Community Credit Union | `unitus-community-credit-union` | 476661 |
| Maps Credit Union (Marion & Polk Schools) | `maps-credit-union` | 462882 |
| Directors Mortgage | `directors-mortgage` | 3240 |
| Mid Oregon Federal Credit Union | `mid-oregon-federal-credit-union` | — |
| First Community Credit Union (OR) | `first-community-credit-union-oregon` | 217251 |
| First Interstate Bank | `first-interstate-bank` | multi-state host |
| Premier Mortgage Resources | `premier-mortgage-resources` | multi-state host |

**Retained OR/PNW strength:** OnPoint, Rogue, Oregon Community CU, First Tech, SELCO, Mortgage Express, Oregon State CU, Columbia Bank, Banner Bank.

### 3. Directory hosts added

Thin national catalog hosts for the new OR regionals listed above.

### 4. Architecture

- Rebuild: `python scripts/build-hmda-oregon-deepen.py`
- Coverage: `data/hmda/oregon/coverage_summary.json`
- Washington remains on its own deepen product (not rebuilt here)

## Intentionally deferred

- Nations Direct Mortgage (only unmapped Top-20 LEI; no confident NMLS+slug in this pass)
- Summit Funding
- Figure Lending / Synergy One / Sierra Pacific Mortgage
- Peak Credit Union, Alliant CU, Consolidated FCU, Go Mortgage, Sunflower Bank
- Full coverage of all 36 Oregon counties

## Multi-state stability

- Other state product folders untouched
- Nationwide QA expected green on orphan slug resolution

## Success criteria checklist

| Criterion | Status |
|-----------|--------|
| OR deeper than first-pass launch | Yes — 27 majors, more regional evidence |
| More high-volume counties with panels | Yes (+9 deepen-band) |
| More high-value OR lenders resolve evidence | Yes — 180 maps, top-50 45/50 |
| Nationwide footprint intact | Yes |
| Data quality high | Yes — exact/high only, 0 orphans |
