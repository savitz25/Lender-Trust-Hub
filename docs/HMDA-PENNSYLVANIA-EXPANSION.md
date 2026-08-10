# HMDA Pennsylvania expansion

**Vintage:** 2025  
**Source:** `data/hmda/by-state/PA/` (from `year_2025.csv` national foundation; also accepts multi-state `data/hmda/cleaned/`)  
**Product slice:** `data/hmda/pennsylvania/`

## Activate / rebuild

```bash
python scripts/process_hmda_national.py year_2025.csv   # if partition missing
python scripts/build-hmda-pennsylvania-slice.py
```

## What goes live

| Surface | Behavior |
|---------|----------|
| `/local-lenders/pennsylvania/{county}` | County market panel for major counties |
| `/lenders/{slug}` | Pennsylvania originations when LEI mapped |
| Loan Estimate Analyzer | `pa:{county}` prefill options |

## Major counties

**Wave 1 — Philly metro:** Philadelphia, Montgomery, Bucks, Delaware, Chester  

**Wave 1 — Pittsburgh:** Allegheny, Westmoreland, Butler, Washington, Beaver  

**Wave 1 — South-central / Lehigh Valley:** Lancaster, York, Berks, Lehigh, Northampton, Dauphin, Cumberland, Lebanon  

**Wave 1 — Other high volume:** Lackawanna, Luzerne, Erie, Monroe, Franklin, Centre, Fayette, Adams, Cambria, Lycoming, Schuylkill, Mercer  

**Deepen:** Blair, Pike, Carbon, Lawrence, Northumberland, Clearfield, Wayne, Somerset, Crawford, Indiana, Columbia, Armstrong, Perry, Bedford  

See `docs/HMDA-PENNSYLVANIA-DEEPEN.md` for the deepen coverage summary.  

## Matching

- Reuse FL/TX/GA/CA/NC/SC/NJ (and other prior-state) curated LEI maps when the LEI has PA activity  
- National NMLS→slug overrides prefer company-level directory hosts (e.g. PNC, Citizens)  
- Precision only — no low-confidence inventing  
- See `data/hmda/pennsylvania/README.md` for mapping counts and top LEIs  

## Coverage snapshot (first pass)

| Asset | Count (approx.) |
|-------|-----------------|
| County market rows | 34 |
| Major named counties | 30 |
| Lender–county activity rows | ~9,200 |
| High-confidence LEI→directory maps | 79 |

Top-volume majors (2025 originations, illustrative): Allegheny ~26.8k, Philadelphia ~24.9k, Montgomery ~19.3k, Bucks ~14.4k, Chester ~13.2k.

## Stability

- Does not modify FL/TX/GA/CA/NC/SC/NJ product folders  
- Coordinates with New York activation: shared config adds `PA` alongside `NY`; separate data folders and file suffixes (`_pa` / `_ny`)  
- QA: `npx tsx scripts/qa-stabilize-fl-tx-ga.ts` (includes PA majors + `pa:` analyzer paths)

## Out of scope (this pass)

- Every Pennsylvania county  
- Low-confidence LEI inventing  
- New major tools or additional states beyond PA (and parallel NY work)
