# Nationwide stabilize / QA pass — 50 states + DC

**Date:** 2026-08-10  
**Scope:** Full stabilize across all HMDA product jurisdictions and core research tools — not a feature expansion.  
**Live set:** 51 jurisdictions (`HMDA_ACTIVE_STATE_CODES`)  
**Runner:** `python scripts/qa-nationwide-stabilize.py`

## Issues found

| # | Severity | Area | Finding |
|---|----------|------|---------|
| 1 | **Info** | Data integrity | All **51** product folders, required CSVs, and prompt-spot major markets resolve with positive applications/originations. |
| 2 | **Info** | Mappings | **379** mapped LEIs; **0** orphan `our_lender_slug` values vs directory catalog. |
| 3 | **Info** | Multi-state primary | **357** multi-state mapped LEIs; primary = max state originations behaves sensibly (e.g. UWM/Rocket/Guaranteed Rate → CA; Huntington → OH; BECU → WA). |
| 4 | **Info** | Tools honesty | Analyzer / Compare meta, labels, and empty-state copy already say **all 50 states + DC** — no stale partial-count copy. |
| 5 | **Info** | Panel wiring | Lender profiles load HMDA + CFPB independently; county pages load `HmdaCountyMarketPanel` + multi-state analyzer prefill via `analyzerCountyOptionSlug`. |
| 6 | **Info** | Analyzer prefixes | Full prefix map present (`tx`…`sd`; FL bare slug). Options loader calls `loadHmdaStateData` for every active code. |

No medium/high product defects found in this pass.

## Fixes applied

1. **Nationwide QA runner** added: `scripts/qa-nationwide-stabilize.py` (Node-free integrity QA for all 51 jurisdictions, spot counties, prefixes, options loads, multi-state primary sample, component wiring, honesty-copy scan, major-export checks).
2. **This document** for handoff and re-run notes.

No production code regressions required — final-four honesty copy and wiring were already correct on `d4a0450`.

## Data QA result (PASS)

```
OK:   435
WARN: 0
FAIL: 0
PASS — nationwide data + wiring integrity looks solid.
```

### Spot markets confirmed (sample)

| Market | Originations (2025 slice) |
|--------|---------------------------|
| Miami-Dade FL | 34,236 |
| Harris TX | 62,628 |
| Los Angeles CA | 106,668 |
| Kings NY | 12,897 |
| Cook IL | 81,303 |
| Franklin OH | 29,514 |
| Maricopa AZ | 111,789 |
| Denver CO | 14,511 |
| King WA | 43,300 |
| Fulton GA | 22,578 |
| Philadelphia PA | 24,937 |
| Middlesex MA | 29,145 |
| Davidson TN | 16,327 |
| Clark NV | 49,879 |
| Salt Lake UT | 28,617 |
| Honolulu HI | 13,362 |
| Anchorage AK | 4,887 |
| Cass ND | 4,100 |
| Minnehaha SD | 4,705 |

## Intentionally deferred / minor known

| Item | Notes |
|------|--------|
| Program Finder DPA depth | Still FL/TX-priority location notes — product scope, not HMDA regression |
| Full browser E2E / mobile screenshots | Not run in this environment (no required Playwright path for data-layer stabilize) |
| CFPB snapshot gaps | Some nationals may lack CFPB panel if company-name mapping incomplete — independent of HMDA |
| Unmapped high-volume regionals | Precision-first LEI→NMLS remains intentional |
| Historical expansion docs | Older `docs/HMDA-*-EXPANSION.md` files still mention partial state counts — historical snapshots, not tools UI |
| Thin-volume final-four markets | AK remote boroughs / small ND plains counties intentionally outside wave-1 major panels |

## Success criteria

| Criterion | Status |
|-----------|--------|
| Nationwide evidence reliability | **Pass** (data + config + panel wiring) |
| Tools honest about national coverage | **Pass** |
| Tools end-to-end prefixes / prefill | **Pass** (all 51 codes) |
| No major broken paths in core research journey | **Pass** |
| Ready for next product phase | **Yes** |

## Re-run

```bash
python scripts/qa-nationwide-stabilize.py
```
