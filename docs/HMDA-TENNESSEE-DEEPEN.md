# Tennessee HMDA deepen (high-volume phase)

**Date:** 2026-08-10  
**Repo:** lender-trust-hub  
**Scope:** Tennessee only (nationwide 50+DC footprint unchanged)

## Goal

Make Tennessee feel deeper than a first-pass major-county launch: more high-volume counties with live market intelligence, more high-value lenders resolving HMDA evidence cleanly, quality over forced matches.

## What improved

### 1. County market intelligence

`HMDA_STATE_CONFIGS.TN.majorCountySlugs` expanded from **20** to **35** panel-ready markets (volume-ranked):

| Band | Counties |
|------|----------|
| Core | Davidson, Shelby, Knox, Hamilton, Rutherford, Montgomery, Williamson, Sumner, Wilson |
| Next | Sullivan, Blount, Maury, Washington, Sevier, Bradley, Robertson, Madison, Anderson, Loudon, Putnam |
| Deepen | **Roane, Dickson, Greene, Hamblen, Jefferson, Cumberland, Coffee, Tipton, McMinn, Cheatham, Hickman, Bedford, Hawkins, Marshall, Gibson** |

Product slice rebuilt from `data/hmda/by-state/TN/`.

### 2. Lender mapping quality (high-confidence only)

| Metric | Before | After |
|--------|--------|-------|
| LEI→slug maps | 124 | **230** |
| Top-20 mapped | 19/20 | **20/20** |
| Top-50 mapped | 39/50 | **44/50** |
| Orphan directory slugs | n/a | **0** |

**Identity repair:** GLEIF re-identification corrected swapped LEIs (Movement vs Veterans United, DHI vs CrossCountry, Freedom vs Guild, Bank of America vs Guaranteed Rate, Cardinal correct LEI, etc.).

**Newly linked / strengthened TN lenders:**

| Lender | Slug | Notes |
|--------|------|--------|
| Eastman Credit Union | `eastman-credit-union` | ~2.8k TN orig.; top unmapped before deepen |
| Leaders Credit Union | `leaders-credit-union` | NMLS 402804 |
| ORNL Federal Credit Union | `ornl-federal-credit-union` | East TN volume |
| Churchill Mortgage | `churchill-mortgage-nashville` | NMLS 1591 (existing TN host) |
| Old National, Renasant, Simmons, Stockton, Liberty CU, Redstone FCU | existing multi-state hosts | |
| FirstBank, MIG, Pinnacle, First Community, TVA ECU, Ascend, Cadence, Wilson Bank, TVFCU | retained/reconfirmed | |

### 3. Directory hosts added

Thin national catalog hosts:

- `eastman-credit-union`
- `leaders-credit-union`
- `ornl-federal-credit-union`

### 4. Architecture

- Rebuild: `python scripts/build-hmda-tennessee-deepen.py`
- Coverage: `data/hmda/tennessee/coverage_summary.json`

## Intentionally deferred

- Legacy Home Loans, Y-12 FCU, Primis Mortgage, Figure Lending
- Community Mortgage Corporation, Home Federal Bank of Tennessee
- Farm Credit Mid-America, Fortera FCU, SmartBank
- SWBC Mortgage, First Citizens National Bank (Dyersburg-area)
- Full coverage of all 95 Tennessee counties

## Multi-state stability

- Other state product folders untouched
- Nationwide QA expected green on orphan slug resolution

## Success criteria checklist

| Criterion | Status |
|-----------|--------|
| TN deeper than first-pass launch | Yes — 35 majors, repaired identities |
| More high-volume counties with panels | Yes (+15 deepen-band) |
| More high-value TN lenders resolve evidence | Yes — 230 maps, top-20 20/20 |
| Nationwide footprint intact | Yes |
| Data quality high | Yes — exact/high only, 0 orphans |
