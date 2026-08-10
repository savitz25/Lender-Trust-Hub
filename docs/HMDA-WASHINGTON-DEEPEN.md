# Washington HMDA deepen (high-volume phase)

**Date:** 2026-08-10  
**Repo:** lender-trust-hub  
**Scope:** Washington only (nationwide 50+DC footprint unchanged)

## Goal

Make Washington feel deeper than a first-pass major-county launch: more high-volume counties with live market intelligence, more high-value lenders resolving HMDA evidence cleanly, quality over forced matches.

## What improved

### 1. County market intelligence

`HMDA_STATE_CONFIGS.WA.majorCountySlugs` expanded from **18** to **28** panel-ready markets:

| Band | Counties |
|------|----------|
| Core | King, Pierce, Snohomish, Spokane, Clark |
| Next | Thurston, Kitsap, Benton, Whatcom, Yakima, Cowlitz, Skagit, Island, Lewis, Mason, Grant, Grays Harbor, Franklin |
| Deepen | **Chelan, Clallam, Kittitas, Walla Walla, Stevens, Douglas, Whitman, Jefferson, Okanogan, Pacific** |

Product slice rebuilt from `data/hmda/by-state/WA/`.

### 2. Lender mapping quality (high-confidence only)

| Metric | Before | After |
|--------|--------|-------|
| LEI→slug maps | 141 | **170** |
| Top-20 mapped | 20/20 | **20/20** |
| Top-50 mapped | 37/50 | **44/50** |
| Orphan directory slugs | n/a | **0** |

**Identity / host quality:** GLEIF-aligned re-identification retained; WA directory hosts preferred where available (Guild / CrossCountry / Bank of America / Veterans United / Lennar / Silverton Snohomish hosts).

**Newly linked high-value WA / PNW lenders:**

| Lender | Slug | Notes |
|--------|------|--------|
| Numerica Credit Union | `numerica-credit-union` | Eastern WA volume |
| Columbia Community Credit Union | `columbia-community-credit-union` | SW WA / Clark |
| Whatcom Educational CU (WECU) | `whatcom-educational-credit-union` | NMLS 401041 |
| Washington Trust Bank | `washington-trust-bank` | Spokane-based |
| HomeStreet Bank | `homestreet-bank` | PNW regional bank |
| Kitsap Credit Union | `kitsap-credit-union` | Peninsula |
| Sound Credit Union | `sound-credit-union-south-sound` | existing host |
| iQ Credit Union | `iq-credit-union-vancouver` | existing host |
| Global FCU, Idaho Central CU, Glacier Bank, Premier Mortgage Resources | multi-state hosts | |

**Retained PNW strength:** BECU, WSECU, Gesa, Spokane Teachers, Columbia Bank, Banner Bank, Evergreen MoneySource, 1st Security Bank of WA.

### 3. Directory hosts added

Thin national catalog hosts:

- `numerica-credit-union`
- `columbia-community-credit-union`
- `whatcom-educational-credit-union`
- `washington-trust-bank`
- `homestreet-bank`
- `kitsap-credit-union`

### 4. Architecture

- Rebuild: `python scripts/build-hmda-washington-deepen.py`
- Coverage: `data/hmda/washington/coverage_summary.json`
- Does not rebuild Oregon (OR remains on prior `build-hmda-or-wa-slices.py` product)

## Intentionally deferred

- OriginPoint, Canopy Mortgage, Sammamish Mortgage
- Cornerstone Capital Bank / Cornerstone First Mortgage
- Figure Lending, Peak Credit Union
- Fibre Federal Credit Union, Red Canoe Credit Union
- Sunflower Bank, Synergy One, Eastside Funding, Bay Equity
- Full coverage of all 39 Washington counties

## Multi-state stability

- Other state product folders untouched
- Nationwide QA expected green on orphan slug resolution

## Success criteria checklist

| Criterion | Status |
|-----------|--------|
| WA deeper than first-pass launch | Yes — 28 majors, more regional evidence |
| More high-volume counties with panels | Yes (+10 deepen-band) |
| More high-value WA lenders resolve evidence | Yes — 170 maps, top-50 44/50 |
| Nationwide footprint intact | Yes |
| Data quality high | Yes — exact/high only, 0 orphans |
