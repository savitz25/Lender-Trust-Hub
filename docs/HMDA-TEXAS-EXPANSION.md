# Texas HMDA expansion (Phase 3 geography)

**Selected state:** Texas  
**Rationale:** Highest HMDA volume in the cleaned multi-state extract (e.g. Harris County alone ~62k originations), strong national lender overlap with existing LEI maps, existing directory footholds (TX branch rows + national profiles), and high SEO value. Georgia remains the logical second expansion.

## Data

| Path | Contents |
|------|----------|
| `data/hmda/texas/` | State slice CSVs + `lei_to_nmls_mapping.csv` |
| `scripts/build-hmda-texas-slice.py` | Builds TX slice from `data/hmda/cleaned/*` + FL LEI maps |

Rebuild:

```bash
python scripts/build-hmda-texas-slice.py
```

## Coverage (initial)

- **~47** high-confidence LEI → directory slug mappings (reuse of curated FL maps; national company slugs preferred by NMLS)
- **~30** major named counties with market summaries (Harris, Dallas, Tarrant, Bexar, Collin, Travis, Denton, Montgomery, Fort Bend, Williamson, …)
- **~13k** lender–county activity rows limited to major counties

## Product wiring

- `lib/hmda/states.ts` — FL + TX configs
- `loadHmdaStateData('TX' | 'FL')` / `loadAllHmdaStateData()`
- Lender evidence panels pick the **primary** state (highest originations) and list other product states
- County pages: `getHmdaCountyEvidence('texas', countySlug)` for major TX counties

## Matching rules

- No new fuzzy LEI inventing
- Only LEIs already curated for Florida with a directory slug are reused for TX
- Prefer company-level national slugs (`rocket-mortgage`, etc.) over geo branch slugs when NMLS is known

## Not in this pass

- Full TX county name table for every FIPS
- Georgia product activation
- Forced low-volume LEI matches
