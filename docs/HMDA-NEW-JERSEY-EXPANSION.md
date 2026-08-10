# New Jersey HMDA expansion (Northeast Phase 1)

**Selected state:** New Jersey (first Northeast evidence-backed state after FL / TX / GA / CA / NC / SC)  
**Rationale:** Strong consumer research demand, dense metro volume (North / Central / Shore), high overlap with already-mapped national banks and IMCs, reusable pipeline for NY / PA / MA.

## Data

| Path | Contents |
|------|----------|
| `data/hmda/new-jersey/` | State slice CSVs + `lei_to_nmls_mapping.csv` |
| `scripts/build-hmda-new-jersey-slice.py` | Builds NJ slice from `data/hmda/cleaned/*` + prior-state LEI maps |

Rebuild:

```bash
python scripts/build-hmda-new-jersey-slice.py
```

## Coverage (initial)

- High-confidence LEI → directory mappings (**68**): reuse FL / TX / GA / CA / NC / SC curated maps + national NMLS→slug, with **NJ directory hosts** where preferred (Guild NJ suburbs, CrossCountry NJ, NAF Marlton/Wayne, Silverton Wayne)
- Major counties (panel-ready, **18**): Ocean, Bergen, Monmouth, Middlesex, Burlington, Camden, Essex, Morris, Union, Gloucester, Mercer, Hudson, Passaic, Somerset, Atlantic, Cape May, Sussex, Hunterdon
- Lender–county activity limited to major named counties for panel clarity
- All 21 NJ counties appear in county market extract; lowest-volume three (Cumberland, Warren, Salem) deferred as panels

## Product wiring

- `lib/hmda/states.ts` — FL + TX + GA + CA + NC + SC + **NJ**
- `loadHmdaStateData('NJ')` / `loadAllHmdaStateData()`
- Lender panels: primary = highest originations among product states; secondary listed
- County pages: `getHmdaCountyEvidence('new-jersey', countySlug)`
- Analyzer: major NJ counties as `nj:{slug}` options
- County LE tool CTA prefill: `nj:{county}`

## Matching rules

- No fuzzy LEI inventing
- Prefer company-level national / NJ directory slugs when NMLS is known
- Only LEIs already high-confidence in prior maps (or explicit NJ curated table — empty at launch)

## Not in this pass

- Every New Jersey county panel
- Low-volume LEI inventing
- Next Northeast state (NY / PA / MA)
