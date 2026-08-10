# Georgia HMDA deepen pass

**Goal:** Make Georgia feel deeper than the initial major-county launch without inventing low-confidence matches.

## What improved

### County market intelligence (panel-ready)

| Wave | Counties |
|------|----------|
| **Prior (config)** | 20 majors (Fulton, Gwinnett, Cobb, DeKalb, Cherokee, Forsyth, Chatham, Henry, Paulding, Hall, Houston, Clayton, Columbia, Coweta, Richmond, Muscogee, Douglas, Bartow, Fayette, Bibb) |
| **Deepen (config + slice)** | **35** named majors — added Jackson, Carroll, Barrow, Newton, Walton, Rockdale, Effingham, Bryan, Glynn, Clarke, Catoosa, Whitfield, Floyd, Spalding, Lowndes |

Each major county page can resolve `getHmdaCountyEvidence('georgia', slug)` for applications, originations, denial context, loan mix, and top matched lenders where activity exists.

Rebuild: `python scripts/build-hmda-georgia-slice.py`

### High-value lender mapping

| Metric | Before | After |
|--------|--------|-------|
| High-confidence LEI → directory maps | 50 | **57** |
| Lender–county activity rows (majors) | ~8.5k | **~10.8k** |

**New / strengthened mappings (high-confidence only):**

| Institution | Directory slug | Notes |
|-------------|----------------|-------|
| Synovus Bank | `synovus-bank` | New national profile + GLEIF LEI |
| Planet Home Lending | `planet-home-lending` | New national profile |
| Mutual of Omaha Mortgage | `mutual-of-omaha-mortgage` | New national profile |
| Zillow Home Loans | `zillow-home-loans` | New national profile |
| Union Home Mortgage Corp. | `union-home-mortgage-reeves-team` | Company LEI → existing GA team listing |
| AmeriHome / Carrington alt LEIs | existing national slugs | Second LEIs for same companies |

Also reuses **FL + TX** curated LEI maps (not FL alone).

### Directory / hygiene

- `lib/mortgage/nationalHmdaLenders.ts` — Synovus + 3 multi-state originators
- `lib/geo/zip-to-county.ts` — additional GA ZIPs (Gwinnett, Cobb, DeKalb, Cherokee, Walton, Rockdale, Clarke, Lowndes, Glynn, Effingham, Bryan)
- CFPB mapping: Synovus NMLS inheritance IDs

## Intentionally deferred

- Full GA county coverage (all 159)
- Low-confidence LEI inventing for top unmapped names without public NMLS + directory profile (e.g. some regional LEIs with empty GLEIF cache)
- Thin invented local branch profiles just to close volume gaps
- Next-state expansion (NC, etc.)

## FL / TX

Unchanged architecture: multi-state load, primary state = highest originations among FL/TX/GA. No FL/TX map rewrites in this pass beyond GA consuming TX maps for shared LEIs.

## Files

- `lib/hmda/states.ts` — GA major county set
- `scripts/build-hmda-georgia-slice.py` — majors + GA curated LEIs + FL/TX reuse
- `data/hmda/georgia/*` — rebuilt slice
- `docs/HMDA-GEORGIA-EXPANSION.md` — initial launch notes
