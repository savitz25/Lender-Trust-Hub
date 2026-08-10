# North Carolina HMDA expansion (Phase 3 geography)

**Selected state:** North Carolina (after Florida, Texas, Georgia, California)  
**Rationale:** Strong Southeast mortgage market, natural continuation after FL/GA, solid national LEI overlap, directory/SEO leverage (Charlotte, Research Triangle, Triad).

## Data

| Path | Contents |
|------|----------|
| `data/hmda/north-carolina/` | State slice CSVs + `lei_to_nmls_mapping.csv` |
| `scripts/build-hmda-north-carolina-slice.py` | Builds NC slice from `data/hmda/cleaned/*` + curated LEI maps |

Rebuild:

```bash
python scripts/build-hmda-north-carolina-slice.py
```

## Coverage (initial)

- High-confidence LEI → directory mappings (reuse FL/TX/GA/CA curated maps; national slugs by NMLS)
- Major counties: Wake, Mecklenburg, Guilford, Forsyth, Durham, Cumberland, Union, Cabarrus, Buncombe, New Hanover, Gaston, Onslow, Johnston, Brunswick, …
- Lender–county activity limited to major named counties for panel clarity

## Product wiring

- `lib/hmda/states.ts` — FL + TX + GA + CA + **NC**
- `loadHmdaStateData('NC')` / `loadAllHmdaStateData()`
- Lender panels: primary = highest originations among product states; secondary states listed
- County pages: `getHmdaCountyEvidence('north-carolina', countySlug)`
- Analyzer: major NC counties as `nc:{slug}` options

## Matching rules

- No fuzzy LEI inventing
- Reuse curated LEI maps when LEI has NC activity
- Prefer company-level national slugs when NMLS is known

## Not in this pass

- Every NC county FIPS name
- Low-volume LEI inventing
- Next-state activation beyond NC
