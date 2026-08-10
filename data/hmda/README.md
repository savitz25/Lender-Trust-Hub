# HMDA cleaned datasets

**Data vintage:** HMDA activity year(s) **2025**  
**Source file (raw, unchanged):** `state_FL-CA-MA-TX-NJ-NY-DC-PA-GA-SC-NC-TN.csv` (~2399 MB)  
**Processed:** streaming LAR → summary tables only  

## What was filtered out

- `action_taken = 6` (purchased loans) — not used for origination market stats  
- Rows missing year, LEI, state, or county  
- States outside: CA, DC, FL, GA, MA, NC, NJ, NY, PA, SC, TN, TX

Priority site markets: **DC, FL, GA, MA, NC, NJ, NY, PA, SC, TN, TX** (Florida sorted first in multi-state files).  
Secondary in extract: **CA**.

## Files in `cleaned/`

| File | Description |
|------|-------------|
| `county_market_summary.csv` | County-level applications, originations, denials, loan-type mix, purchase vs refinance |
| `lender_activity_by_county.csv` | LEI activity per county + market share of originations |
| `lender_state_summary.csv` | LEI totals per state + top counties served |
| `lei_mapping_candidates.csv` | Unique LEIs ranked for NMLS/slug matching (`priority_match` high/medium/low) |
| `manifest.json` | Machine-readable run stats and notes |

## Files in `florida/`

Florida-only subsets of the same schemas (FL-first product work).

## Files in `texas/`

Texas product slice (Phase 3 geography expansion). Rebuild with:

```bash
python scripts/build-hmda-texas-slice.py
```

See `docs/HMDA-TEXAS-EXPANSION.md`.

## Files in `georgia/`

Georgia product slice. Rebuild with:

```bash
python scripts/build-hmda-georgia-slice.py
```

See `docs/HMDA-GEORGIA-EXPANSION.md`.

## Column notes

- **Applications:** non-purchase HMDA rows with valid geography (includes originated, denied, withdrawn, etc.)  
- **Originations:** `action_taken = 1`  
- **Denials:** `action_taken = 3`  
- **Loan types:** Conventional / FHA / VA / USDA+other from HMDA `loan_type`  
- **Purchase vs refinance:** from `loan_purpose` (1 vs 31/32)  
- **institution_name / nmls_id:** empty placeholders for future LEI mapping  

## Do not

- Publish these as “Trust Scores” or invent ranking metrics  
- Delete the raw CSV — keep it for reprocessing  

## Re-run

```bash
python scripts/process_hmda.py path/to/raw.csv
```
