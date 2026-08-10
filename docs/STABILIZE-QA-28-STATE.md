# 28-state stabilize / QA pass

**Date:** 2026-08-10  
**Scope:** Full stabilize across all live HMDA product states and core research tools — not a feature expansion.  
**States:** FL · TX · GA · CA · NC · SC · NJ · NY · PA · MA · RI · VT · ME · CT · NH · VA · MD · DE · DC · TN · IL · OH · MI · IN · AZ · CO · WI · MN  
**Runner:** `python scripts/qa-28-state-stabilize.py`

## Issues found

| # | Severity | Area | Finding |
|---|----------|------|---------|
| 1 | **Medium** | Tools honesty copy | Analyzer meta, Compare UI labels, empty-state notes, and field hints still said **10–13 product states** (through ME / New England) after AZ · CO · WI · MN (and earlier expansions) went live. |
| 2 | **Info** | Data integrity | All **28** product folders, required CSVs, and prompt-spot major counties resolve with positive applications/originations. **No orphan** `our_lender_slug` values vs directory catalog (221 mapped LEIs). |
| 3 | **Info** | Multi-state primary | **211** multi-state mapped LEIs; primary = max state originations behaves sensibly (e.g. UWM/Rocket/Guaranteed Rate → CA; Huntington → OH; LMCU → MI). |
| 4 | **Info** | Panel components | County evidence uses `HmdaCountyMarketPanel` (not a separate “CountyEvidence” name). Lender profiles wire HMDA + CFPB panels independently with separate source notes. |
| 5 | **Info** | Analyzer prefixes | Full prefix map present in `county-option.ts` (FL bare slug; all others `xx:`). Earlier QA false positives were parser bugs (unquoted TS keys), not product breakage. |
| 6 | **Info** | Nav / tools entry points | Calculators hub, program finder, My Lending, analyzer, compare, profile/county CTAs, and `analyzerCountyOptionSlug` prefill paths all present in code. |

## Fixes applied

1. **Honesty copy → 28 product states** in:
   - `app/tools/loan-estimate-analyzer/page.tsx`
   - `app/tools/compare-loan-estimates/page.tsx`
   - `components/tools/LoanEstimateAnalyzer.tsx`
   - `components/tools/LoanEstimateCompare.tsx`
   - `lib/tools/loan-estimate-analyzer/compare.ts`
   - `lib/tools/loan-estimate-analyzer/analyze.ts`
   - `lib/tools/loan-estimate-analyzer/client-analyze.ts`
   - `lib/hmda/queries.ts` (comment only)
2. **QA script** hardened: `scripts/qa-28-state-stabilize.py` (correct prefix parsing, spot counties via name→slug, multi-state primary sample, component wiring checks, stale-copy scan).

## Data QA result (PASS)

- All 28 product folders have required CSVs  
- Prompt spot counties (Miami-Dade, Harris, Fulton, LA/SD/Santa Clara, Wake, Horry, Bergen, Kings, Manhattan `new-york-county`, Philadelphia, Middlesex MA, Providence, Chittenden, Cumberland ME, western-connecticut, Hillsborough NH, Fairfax, Montgomery MD, New Castle, DC, Davidson/Shelby, Cook, Franklin OH, Oakland MI, Marion IN, Milwaukee, Hennepin, Maricopa, Denver) all present with positive volume  
- All mapping slugs resolve in the directory catalog  
- Multi-state nationals show sensible primary states  
- Analyzer prefixes `tx`…`mn` wired; FL remains bare  
- Core research entry points and CFPB + HMDA coexistence code paths intact  

## Intentionally deferred / minor known

| Item | Notes |
|------|--------|
| Program Finder DPA depth | Still FL/TX-priority location notes — product scope, not HMDA regression |
| WI / MN deepen | Parallel work may still expand major-county / mapping depth; this pass did not rewrite WI/MN slices |
| Historical expansion docs | Older `docs/HMDA-*-EXPANSION.md` files still mention 20–26 state counts — historical snapshots; not user-facing tools copy |
| Full browser E2E / mobile screenshots | Not run here (Node/Playwright path not required for data-layer stabilize) |
| CFPB snapshot gaps | Some nationals may lack CFPB panel if company-name mapping incomplete — independent of HMDA |
| Unmapped high-volume regionals | Precision-first LEI→NMLS; intentional empty mapping slots |
| County “coming soon” city highlights | Seed-style marketing highlights on some state pages — not HMDA panel breakage |

## Success criteria

| Criterion | Status |
|-----------|--------|
| All 28 states’ evidence pages reliable | **Pass** (data + config + panel wiring) |
| Tools honest about multi-state coverage | **Pass** (copy fixed) |
| Tools end-to-end across states (prefill / prefixes) | **Pass** (code path + options for all 28) |
| No major broken paths in core research journey | **Pass** (stabilize scope) |
| Ready to pause or expand again | **Yes** |

## Re-run

```bash
python scripts/qa-28-state-stabilize.py
```
