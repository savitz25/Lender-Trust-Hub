# Six-state stabilize / QA pass — FL · TX · GA · CA · NC · SC

**Date:** 2026-08  
**Script:** `npx tsx scripts/qa-stabilize-fl-tx-ga.ts`  
**Scope:** Stabilize multi-state HMDA evidence + core research tools (not a feature build)

## Issues found

| # | Severity | Area | Issue |
|---|----------|------|--------|
| 1 | **Medium** | Analyzer meta / Compare UI | Public copy still said “2025 **Florida** HMDA” while tools already used six-state product data — misleading for TX/GA/CA/NC/SC users. |
| 2 | **Medium** | Compare limitations | Compare educational limitations string still claimed Florida-only market activity. |
| 3 | **Low** | Maintainability | Nested ternaries for state labels + county CTA prefills risked drift when adding states (SC/NC). |
| 4 | **Low** | Types / comments | Analyzer types/comments still described only `tx:`/`ga:` prefixes. |
| 5 | **Info** | CFPB | Complaint rate normalization still scales to **Florida** HMDA originations when present (documented product choice). |
| 6 | **Info** | Program Finder | DPA location notes remain FL/TX-priority only — intentional, not a six-state HMDA bug. |
| 7 | **High** | NC mapping | NC LEI map pointed Movement (NMLS 39179) at `movement-mortgage-charlotte`, a **missing catalog slug** — top-lender links / evidence host would 404. |

No wrong-state evidence bleed found on major counties in the automated matrix.

## Fixes applied

1. **Honesty copy** — Analyzer meta description, Compare page bullet, and Compare limitations now say multi-state HMDA (FL/TX/GA/CA/NC/SC).
2. **`county-option.ts` helpers** — shared `parseAnalyzerCountyOption`, `analyzerCountyOptionSlug`, `hmdaStateDisplayName` so county CTAs and panels cannot drift by state.
3. **County page CTA** — uses `analyzerCountyOptionSlug(state, county)` for all product states.
4. **Panels / analyze / serialize-context** — state display names via helper (no nested ternary chain).
5. **QA expansion** — script covers all six states’ majors, prompt spot counties (including NC Wake/Mecklenburg/Guilford/Durham/Buncombe and SC York), orange FL vs CA collision, mapping→catalog integrity, CFPB coexistence smoke, prefill helper, and analyze paths for every product-state prefix.
6. **NC Movement host** — added `movement-mortgage-charlotte` directory profile so NC HMDA mapping slug resolves (company NMLS 39179).

## Spot-check matrix (automated)

| State | Counties |
|-------|----------|
| **FL** | Miami-Dade, Broward, Palm Beach, Hillsborough, Orange |
| **TX** | Harris, Dallas, Tarrant, Travis, Bexar |
| **GA** | Fulton, Gwinnett, Cobb, DeKalb, Chatham |
| **CA** | Los Angeles, San Diego, Orange, Santa Clara, Sacramento |
| **NC** | Wake, Mecklenburg, Guilford, Durham, Buncombe |
| **SC** | Horry, Greenville, Charleston, Richland, York (+ Sumter/Pickens/Oconee hygiene) |

**Lenders:** Rocket, UWM, Synovus, Truist, Regions, Ameris, Wells Fargo, SouthState, Movement (Myrtle Beach), First Citizens, Silverton/Vanderbilt, Atlantic Bay, Lower, NVR, Carolina One, Gateway, CA deepen hosts, etc.

**Analyzer keys:** bare FL, `tx:`, `ga:`, `ca:`, `nc:`, `sc:` including `orange` vs `ca:orange`.

## Manual / code-path review (tools & discovery)

| Flow | Status |
|------|--------|
| Lender profile HMDA panel | Renders when mapped; primary = highest originations among product states; `otherStates` listed |
| Lender profile CFPB panel | Coexists when curated mapping + snapshot present; separate source notes |
| County HMDA market panel | Majors resolve; top matched lenders link only when catalog slug exists |
| County → Analyzer/Compare CTA | Prefills product-state county option slug |
| Analyzer ↔ Compare handoff | Draft storage + dual CTAs intact |
| My Lending save/reopen | Reopen hooks present on Analyzer (session storage consume) — not re-instrumented end-to-end in browser this pass |
| Program Finder | Educational fits + FL/TX DPA location layer; other states use generic finder path |
| Nav / calculators hub / tools CTAs | Entry points present (Navbar, calculators hub, county/profile CTAs) |

## Remaining known minor issues (intentionally deferred)

- Unmatched top-LEI rows on county panels (name only) — honesty over forced links
- Bare Florida county option slugs vs prefixed other states — works; slight inconsistency
- CFPB normalization prefers Florida originations when available
- Not every national/regional HMDA lender has a CFPB mapping or snapshot row
- Program Finder DPA research notes not expanded to GA/CA/NC/SC in this pass
- No dedicated visual/mobile regression suite; My Lending not fully browser-tested here
- Catalog seed ratings remain suppressed by sanitize pipeline (by design)

## Confirmation

After fixes + QA script **PASS** + `tsc --noEmit`:

- FL / TX / GA / CA / NC / SC major counties resolve evidence with correct state labels  
- Prompt spot counties render useful market intelligence data  
- Spot lender primary-state selection is multi-state aware  
- Analyzer multi-state county handoff works for all six prefixes  
- Core research architecture unchanged  

Re-run anytime:

```bash
npx tsx scripts/qa-stabilize-fl-tx-ga.ts
npx tsc --noEmit
```
