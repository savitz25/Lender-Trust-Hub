# Utah HMDA deepen (high-volume phase)

**Date:** 2026-08-10  
**Repo:** lender-trust-hub  
**Scope:** Utah only (nationwide 50+DC footprint unchanged)

## Goal

Make Utah feel deeper than a first-pass major-county launch: more high-volume counties with live market intelligence, more high-value lenders resolving HMDA evidence cleanly, quality over forced matches.

## What improved

### 1. County market intelligence

`HMDA_STATE_CONFIGS.UT.majorCountySlugs` expanded from **16** to **26** panel-ready markets:

| Band | Counties |
|------|----------|
| Core | Salt Lake, Utah, Davis, Weber, Washington |
| Next | Cache, Tooele, Iron, Box Elder, Wasatch, Summit, Uintah, Sanpete, Sevier, Carbon, Morgan |
| Deepen | **Duchesne, Kane, Juab, Millard, Emery, Beaver, Rich, Grand, Garfield, San Juan** |

Intentionally deferred thin-volume counties (Wayne, Piute, Daggett).

Product slice rebuilt from `data/hmda/by-state/UT/`.

### 2. Lender mapping quality (high-confidence only)

| Metric | Before | After |
|--------|--------|-------|
| LEI→slug maps | 125 | **156** |
| Top-20 mapped | 16/20 | **20/20** |
| Top-50 mapped | 41/50 | **46/50** |
| Orphan directory slugs | n/a | **0** |

**Identity repair:** GLEIF re-identification for national LEIs (Bank of America, Movement, Cardinal, Lennar, etc.).

**Newly linked high-value UT lenders:**

| Lender | Slug | NMLS |
|--------|------|------|
| My Move Mortgage (Momentum Loans) | `my-move-mortgage` | — |
| Cyprus Credit Union | `cyprus-credit-union` | 666254 |
| Canyon View Credit Union | `canyon-view-credit-union` | 654272 |
| State Bank of Southern Utah | `state-bank-of-southern-utah` | — |
| Cache Valley Bank | `cache-valley-bank` | — |
| Granite Credit Union | `granite-credit-union` | — |
| Plains Commerce Bank | multi-state host | prior map |

**Retained Wasatch Front / Mountain West stack:** America First FCU, Mountain America FCU, Intercap, Goldenwest, First Colony, SecurityNational, Utah Community CU, RanLife, Bank of Utah, Deseret First, Utah First, Chartway, Security Home Mortgage, Provident Funding, Zions Bank.

### 3. Directory hosts added

Thin national catalog hosts for the new UT regionals listed above.

### 4. Architecture

- Rebuild: `python scripts/build-hmda-utah-deepen.py`
- Coverage: `data/hmda/utah/coverage_summary.json`
- Nevada remains on its own deepen product (not rebuilt here)

## Intentionally deferred

- Canopy Mortgage
- Direct Rate Home Loans
- Veritas Funding
- Utah Power FCU
- CLM Mortgage / Belem Servicing
- Northpointe Bank, Figure Lending
- Wayne / Piute / Daggett (thin HMDA volume)

## Multi-state stability

- Other state product folders untouched
- Nationwide QA expected green on orphan slug resolution

## Success criteria checklist

| Criterion | Status |
|-----------|--------|
| UT deeper than first-pass launch | Yes — 26 majors, Top-20 20/20 |
| More high-volume counties with panels | Yes (+10 deepen-band) |
| More high-value UT lenders resolve evidence | Yes — 156 maps, top-50 46/50 |
| Nationwide footprint intact | Yes |
| Data quality high | Yes — exact/high only, 0 orphans |
