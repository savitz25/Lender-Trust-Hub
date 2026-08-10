# California HMDA deepen pass

**Goal:** Make California feel deeper than the initial major-county launch without inventing low-confidence matches.

## What improved

### County market intelligence (panel-ready)

| Wave | Counties |
|------|----------|
| **Initial** | 24 majors (LA, San Diego, Riverside, Orange, San Bernardino, Sacramento, Santa Clara, Alameda, Contra Costa, Kern, Fresno, San Joaquin, Ventura, Placer, San Mateo, Solano, SF, Sonoma, Stanislaus, Tulare, Santa Barbara, SLO, Monterey, Marin) |
| **Deepen** | **+12** — El Dorado, Merced, Shasta, Butte, Madera, Santa Cruz, Yolo, Nevada, Kings, Napa, Imperial, Humboldt (**36** total) |

Each major county resolves `getHmdaCountyEvidence('california', slug)` for apps, originations, denials, loan mix, and top matched lenders where activity exists.

Rebuild: `python scripts/build-hmda-california-slice.py`

### High-value lender mapping

| Metric | Before | After (approx.) |
|--------|--------|-----------------|
| High-confidence LEI → directory maps | 54 | **58** (prior maps + CA curated) |
| Lender–county activity rows | ~10.4k | **~13.3k** |

**New CA-focused profiles + LEI maps (published NMLS + GLEIF name):**

| Institution | NMLS | Directory slug |
|-------------|------|----------------|
| Sun West Mortgage Company | 3277 | `sun-west-mortgage` |
| American Financial Network | 237341 | `american-financial-network` |
| Kind Lending | 3925 | `kind-lending` |
| AmWest Funding | 167441 | `amwest-funding` |

Also expanded national NMLS→slug table for CA directory hosts (Bay Equity, Nova, Silverton, SoFi, Flagstar, USAA, Citizens, U.S. Bank).

### Directory / hygiene

- `lib/mortgage/nationalHmdaLenders.ts` — four CA-headquartered national profiles
- `lib/geo/zip-to-county.ts` — additional CA ZIP hints (LA, SD, Orange, IE, Sacramento, Bay Area, deepen markets)
- Multi-state primary-state behavior unchanged (FL/TX/GA/CA)

## Intentionally deferred

- Full CA county coverage (all 58 in extract)
- High-volume LEIs without clear public NMLS + directory host (e.g. some blanks in GLEIF cache, non-QM niches, reverse-only shops)
- Thin invented local branch profiles just to close volume gaps
- Next state after CA

## Files

- `scripts/build-hmda-california-slice.py`
- `lib/hmda/states.ts` — CA major set
- `data/hmda/california/*` — rebuilt slice
- `docs/HMDA-CALIFORNIA-EXPANSION.md` — initial launch notes
