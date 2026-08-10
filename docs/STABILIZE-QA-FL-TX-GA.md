# Stabilize / QA pass — FL + TX + GA evidence & tools

**Date:** 2026-08 (stabilize before next expansion)  
**Script:** `npx tsx scripts/qa-stabilize-fl-tx-ga.ts`

## Issues found

| # | Severity | Area | Issue |
|---|----------|------|--------|
| 1 | **High** | Analyzer | `analyzeLoanEstimate` county context always forced Florida — TX/GA option slugs (`tx:`, `ga:`) never resolved server-side. |
| 2 | **High** | County → tools | `LoanEstimateToolsCta` on county pages only passed `countySlug` for **Florida**, so TX/GA pages never prefilled Analyzer/Compare market context. |
| 3 | **Medium** | Analyzer / Compare UI | Labels still said “Florida originations / Florida county” while bootstrap already used multi-state primary volumes — mislabeled GA/TX lenders as FL. |
| 4 | **Medium** | Copy | Analyzer page FAQ, limitations, and citations referred only to Florida. |
| 5 | **Low** | County panel | Denial-rate hint described a formula that did not match the cleaned extract (apps denominator). |

## Fixes applied

1. Shared `parseAnalyzerCountyOption` + multi-state county resolution in `analyze.ts` / `serialize-context.ts`
2. County page CTA builds `tx:{slug}` / `ga:{slug}` query params for major markets
3. Lender/county UI + types expose `primaryStateName` / `stateOriginations` / `stateName`
4. Multi-state copy on Analyzer page, client-analyze limitations, Compare HMDA strip
5. Denial-rate hint aligned to “denials ÷ applications”

## Spot-check matrix (automated)

- **FL counties:** miami-dade, broward, palm-beach, hillsborough, orange  
- **TX counties:** harris, dallas, tarrant, travis, bexar  
- **GA counties:** fulton, gwinnett, cobb, dekalb, chatham  
- **Lenders:** rocket, UWM, synovus, truist, regions, ameris, wells fargo  
- **Bootstrap keys:** `miami-dade`, `tx:harris`, `ga:fulton`, rocket, synovus  

## Remaining known minor issues (deferred)

- Some county “top lenders” rows are unmatched LEIs (name only, no profile link) — intentional honesty, not broken links
- Analyzer dropdown still uses bare Florida slugs (legacy) vs `tx:`/`ga:` prefixes — works, slightly inconsistent
- CFPB normalization still scales complaints to **Florida** HMDA originations when available (product choice; not multi-state rate)
- Not every national lender has both HMDA + CFPB panels
- Mobile polish is “good enough”; no dedicated visual regression suite
- My Lending / Program Finder not re-instrumented beyond smoke of entry points in this pass

## Confirmation

After fixes + `qa-stabilize-fl-tx-ga.ts` **PASS**:

- FL / TX / GA major counties resolve evidence with correct state labels  
- Spot county top-lender **linked** slugs exist in the catalog  
- Analyzer multi-state county handoff works for `tx:` and `ga:`  
- Core research architecture (multi-state HMDA load) unchanged  

Re-run anytime:

```bash
npx tsx scripts/qa-stabilize-fl-tx-ga.ts
npx tsc --noEmit
```
