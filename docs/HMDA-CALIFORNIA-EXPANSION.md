# California HMDA expansion (Phase 3 geography)

**Selected state:** California (after Florida, Texas, Georgia)  
**Rationale:** Largest-scale mortgage market in the multi-state extract, high consumer research demand, strong overlap with national LEI maps already curated for FL/TX/GA.

## Data

| Path | Contents |
|------|----------|
| `data/hmda/california/` | State slice CSVs + `lei_to_nmls_mapping.csv` |
| `scripts/build-hmda-california-slice.py` | Builds CA slice from `data/hmda/cleaned/*` + FL/TX/GA LEI maps |

Rebuild:

```bash
python scripts/build-hmda-california-slice.py
```

## Coverage (initial)

- High-confidence LEI → directory mappings (reuse FL / TX / GA curated maps + national NMLS→slug)
- Major counties (panel-ready): Los Angeles, San Diego, Riverside, Orange, San Bernardino, Sacramento, Santa Clara, Alameda, Contra Costa, Kern, Fresno, San Joaquin, Ventura, Placer, San Mateo, Solano, San Francisco, Sonoma, Stanislaus, Tulare, Santa Barbara, San Luis Obispo, Monterey, Marin
- Lender–county activity limited to major named counties for panel clarity

## Product wiring

- `lib/hmda/states.ts` — FL + TX + GA + **CA**
- `loadHmdaStateData('CA')` / `loadAllHmdaStateData()`
- Lender panels: primary = highest originations among product states; secondary listed
- County pages: `getHmdaCountyEvidence('california', countySlug)`
- Analyzer: major CA counties as `ca:{slug}` options
- County LE tool CTA prefill: `ca:{county}`

## Matching rules

- No fuzzy LEI inventing
- Prefer company-level national / CA directory slugs when NMLS is known
- Only LEIs already high-confidence in prior maps (or explicit CA curated table)

## Not in this pass

- Every California county panel
- Low-volume LEI inventing
- Next state after CA
