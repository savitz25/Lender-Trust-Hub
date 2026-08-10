# South Carolina HMDA expansion (Phase 3 geography)

**Selected state:** South Carolina (after Florida, Georgia, North Carolina in the Southeast sequence; TX and CA remain active multi-state peers)  
**Rationale:** Natural Southeast continuation, meaningful metro volume (Grand Strand, Upstate, Lowcountry, Midlands), strong overlap with already-mapped national and regional lenders.

## Data

| Path | Contents |
|------|----------|
| `data/hmda/south-carolina/` | State slice CSVs + `lei_to_nmls_mapping.csv` |
| `scripts/build-hmda-south-carolina-slice.py` | Builds SC slice from `data/hmda/cleaned/*` + prior-state LEI maps |

Rebuild:

```bash
python scripts/build-hmda-south-carolina-slice.py
```

## Coverage (initial)

- High-confidence LEI → directory mappings (reuse FL / TX / GA / CA / NC curated maps + national NMLS→slug, with SC directory hosts where preferred)
- Major counties (panel-ready): Horry, Greenville, Charleston, Spartanburg, Richland, Berkeley, York, Lexington, Beaufort, Dorchester, Anderson, Aiken, Lancaster, Sumter, Florence, Pickens, Kershaw, Laurens, Jasper, Georgetown
- Lender–county activity limited to major named counties for panel clarity

## Product wiring

- `lib/hmda/states.ts` — FL + TX + GA + CA + NC + **SC**
- `loadHmdaStateData('SC')` / `loadAllHmdaStateData()`
- Lender panels: primary = highest originations among product states; secondary listed
- County pages: `getHmdaCountyEvidence('south-carolina', countySlug)`
- Analyzer: major SC counties as `sc:{slug}` options
- County LE tool CTA prefill: `sc:{county}`

## Matching rules

- No fuzzy LEI inventing
- Prefer company-level national / SC directory slugs when NMLS is known
- Only LEIs already high-confidence in prior maps (or explicit SC curated table)

## Not in this pass

- Every South Carolina county panel
- Low-volume LEI inventing
- Next state after SC
