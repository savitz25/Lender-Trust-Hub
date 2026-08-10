# Ten-state stabilize / QA pass — FL · TX · GA · CA · NC · SC · NJ · NY · PA · MA

**Date:** 2026-08-10  
**Scope:** Multi-state HMDA evidence, major county spots, tools honesty copy, profile → analyzer prefill  
**Runner:** `python scripts/qa-ten-state-stabilize.py` (+ review of `scripts/qa-stabilize-fl-tx-ga.ts` matrix)

## Issues found

| # | Severity | Area | Finding |
|---|----------|------|---------|
| 1 | **Medium** | Tools honesty copy | Analyzer meta, Compare UI, empty-state notes, and field hints still said **7 states** (through NJ) after NY / PA / MA went live. |
| 2 | **Medium** | Profile → tools CTA | Lender profile `LoanEstimateToolsCta` only prefilled county for **Florida**; TX–MA profiles dropped county context from analyzer/compare links. |
| 3 | **Info** | Data integrity | Full 10-state product slices, major-county spots, and **689** mapping slugs all resolve — no data-layer failures. |
| 4 | **Info** | Cross-state collisions | Shared county names (orange, essex, suffolk, middlesex, etc.) are correctly disambiguated via `tx:` / `ca:` / `nj:` / `ma:` … prefixes; bare `orange` remains Florida. |
| 5 | **Info** | Program Finder | Location DPA notes remain FL/TX-priority — intentional product scope, not an HMDA regression. |
| 6 | **Info** | CFPB coexist | National profiles still load HMDA + CFPB panels independently with separate source notes (code path unchanged). |

## Fixes applied

1. **Honesty copy** updated to ten product states (FL, TX, GA, CA, NC, SC, NJ, NY, PA, MA) in:
   - `app/tools/loan-estimate-analyzer/page.tsx`
   - `app/tools/compare-loan-estimates/page.tsx`
   - `components/tools/LoanEstimateAnalyzer.tsx`
   - `components/tools/LoanEstimateCompare.tsx`
   - `lib/tools/loan-estimate-analyzer/analyze.ts`
   - `lib/tools/loan-estimate-analyzer/client-analyze.ts`
   - `lib/tools/loan-estimate-analyzer/compare.ts`
2. **Profile CTA prefill** uses `analyzerCountyOptionSlug(state, county)` for all product states (`app/lenders/[slug]/page.tsx`).
3. **Data QA script** added: `scripts/qa-ten-state-stabilize.py` (Node-free; safe for CI/local).

## Data QA result (PASS)

- All 10 product folders have required CSVs  
- Prompt spot counties resolve with positive apps/orig for every state  
- All mapping `our_lender_slug` values exist in the directory catalog  
- Multi-state nationals show sensible primary states (e.g. Rocket primary CA, Citizens primary NY, Leader Bank primary MA)  
- Analyzer prefixes `tx`…`ma` wired in `county-option.ts`  
- `tsconfig` excludes `scripts/` so QA tools do not break `next build`

## Intentionally deferred / minor known

| Item | Notes |
|------|--------|
| Program Finder DPA depth | Still FL/TX-focused location notes |
| Island MA counties | Dukes / Nantucket panels are thin-volume but intentional full-state coverage |
| Unmapped high-volume regionals | e.g. some MA CUs / banks without verified company NMLS — precision-first |
| Full browser E2E / mobile screenshots | Not run in this environment (no local Node path for Playwright) |
| CFPB snapshot gaps | Some nationals may lack CFPB panel if snapshot name mapping incomplete — soft fail in TS QA |

## Success criteria

| Criterion | Status |
|-----------|--------|
| Ten states’ evidence pages reliable | **Pass** (data + config) |
| Tools honest about multi-state coverage | **Pass** (copy fixed) |
| Core research CTAs multi-state | **Pass** (profile prefill fixed) |
| No major broken paths in research journey | **Pass** (stabilize scope) |
| Ready to pause or expand again | **Yes** |

## Re-run

```bash
python scripts/qa-ten-state-stabilize.py
# Optional (requires Node):
npx tsx scripts/qa-stabilize-fl-tx-ga.ts
```
