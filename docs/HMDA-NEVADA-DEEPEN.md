# Nevada HMDA deepen (high-volume phase)

**Date:** 2026-08-10  
**Repo:** lender-trust-hub  
**Scope:** Nevada only (nationwide 50+DC footprint unchanged)

## Goal

Make Nevada feel deeper than a first-pass major-county launch: more high-volume counties with live market intelligence, more high-value lenders resolving HMDA evidence cleanly, quality over forced matches.

## What improved

### 1. County market intelligence

`HMDA_STATE_CONFIGS.NV.majorCountySlugs` expanded from **9** to **15** panel-ready markets (nearly all counties with meaningful HMDA volume):

| Band | Counties |
|------|----------|
| Core | Clark, Washoe |
| Next | Lyon, Nye, Douglas, Elko, Carson City, Churchill, Humboldt |
| Deepen | **White Pine, Storey, Lander, Lincoln, Pershing, Mineral** |

Intentionally deferred: Esmeralda and Eureka (minimal HMDA volume).

Product slice rebuilt from `data/hmda/by-state/NV/`.

### 2. Lender mapping quality (high-confidence only)

| Metric | Before | After |
|--------|--------|-------|
| LEI→slug maps | 116 | **144** |
| Top-20 mapped | 19/20 | **20/20** |
| Top-50 mapped | 37/50 | **43/50** |
| Orphan directory slugs | n/a | **0** |

**Identity repair:** GLEIF re-identification (e.g. Bank of America LEI no longer mislabeled as Guaranteed Rate; Movement / Cardinal / CrossCountry / Guild aligned).

**Newly linked high-value NV lenders:**

| Lender | Slug | Notes |
|--------|------|--------|
| KBHS Home Loans | `kbhs-home-loans` | Builder-channel; was only unmapped Top-20 |
| Silver State Schools Credit Union | `silver-state-schools-credit-union` | NMLS 382004 |
| One Nevada Credit Union | `one-nevada-credit-union` | Local NV CU |
| Evergreen MoneySource | `evergreen-moneysource-mortgage` | multi-state host |
| Cardinal Financial | `cardinal-financial` | correct LEI |
| Premier Mortgage Resources | multi-state host | |

**Retained NV / Mountain West strength:** Greater Nevada CU, America First FCU, Mountain America FCU, Zions Bank, Academy / PRMI / Intercap reuse via prior maps.

### 3. Directory hosts added

Thin national catalog hosts:

- `one-nevada-credit-union`
- `silver-state-schools-credit-union`
- `kbhs-home-loans`

### 4. Architecture

- Rebuild: `python scripts/build-hmda-nevada-deepen.py`
- Coverage: `data/hmda/nevada/coverage_summary.json`
- Utah remains on prior `build-hmda-ut-nv-slices.py` product (not rebuilt here)

## Intentionally deferred

- Figure Lending, Kiavi Funding
- United Federal Credit Union
- Inspire Home Loans, OCMBC
- Panorama Mortgage, Gold Star Mortgage, Canopy Mortgage, GoodLeap
- East West Bank, Toll Brothers Mortgage, Moria Development
- Esmeralda / Eureka counties (thin volume)

## Multi-state stability

- Other state product folders untouched
- Nationwide QA expected green on orphan slug resolution

## Success criteria checklist

| Criterion | Status |
|-----------|--------|
| NV deeper than first-pass launch | Yes — 15 majors, Top-20 20/20 |
| More high-volume counties with panels | Yes (+6 deepen-band) |
| More high-value NV lenders resolve evidence | Yes — 144 maps, top-50 43/50 |
| Nationwide footprint intact | Yes |
| Data quality high | Yes — exact/high only, 0 orphans |
