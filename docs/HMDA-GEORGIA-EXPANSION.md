# Georgia HMDA expansion (Phase 3 geography)

**Selected state:** Georgia (after Florida + Texas)  
**Rationale:** Strong Southeast volume, existing directory coverage (metro Atlanta, Savannah, Columbus), clean reuse of multi-state cleaned extract and curated LEI maps.

## Data

| Path | Contents |
|------|----------|
| `data/hmda/georgia/` | State slice CSVs + `lei_to_nmls_mapping.csv` |
| `scripts/build-hmda-georgia-slice.py` | Builds GA slice from `data/hmda/cleaned/*` + FL LEI maps |

Rebuild:

```bash
python scripts/build-hmda-georgia-slice.py
```

## Coverage (initial)

- High-confidence LEI → directory mappings (reuse FL curated maps; national slugs by NMLS)
- Major counties: Fulton, Gwinnett, Cobb, DeKalb, Cherokee, Forsyth, Chatham, Henry, Paulding, Hall, Houston, Clayton, Columbia, Coweta, Richmond, Muscogee, Douglas, Bartow, Fayette, Bibb, …
- Lender–county activity limited to major named counties for panel clarity

## Product wiring

- `lib/hmda/states.ts` — FL + TX + **GA**
- `loadHmdaStateData('GA')` / `loadAllHmdaStateData()`
- Lender panels: primary = highest originations among FL/TX/GA; secondary states listed
- County pages: `getHmdaCountyEvidence('georgia', countySlug)`
- Analyzer: major GA counties as `ga:{slug}` options

## Matching rules

- No fuzzy LEI inventing
- Only LEIs already curated for Florida with a directory slug
- Prefer company-level national slugs when NMLS is known

## Not in this pass

- Every GA county name / panel
- Low-volume LEI inventing
- Next state after GA (NC remains a natural candidate)
