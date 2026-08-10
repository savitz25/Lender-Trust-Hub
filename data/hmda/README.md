# HMDA data foundation (national)

**Source of truth:** `year_2025.csv` (nationwide HMDA LAR, **2025**)  
**Raw size:** ~4.76 GB (gitignored)  
**Processed:** streaming LAR → national summaries + by-state partitions  

## Filters (same standard as prior state slices)

| Filter | Rule |
|--------|------|
| Purchased loans | Drop `action_taken = 6` |
| Incomplete geo | Drop missing year, LEI, state, or county FIPS |
| Invalid state | Drop codes outside US states/DC/territories |
| Applications | All kept non-purchase rows with valid geo |
| Originations | `action_taken = 1` |
| Denials | `action_taken = 3` |

**Scan stats:** 13,543,606 rows → **11,660,618 kept** | states/territories: **54**

## Layout

```text
data/hmda/
  national/                 # full US aggregates
    county_market_summary.csv
    lender_activity_by_county.csv   # large; often gitignored — rebuild locally
    lender_state_summary.csv
    lei_mapping_candidates.csv
    manifest.json
  by-state/
    index.json              # quick stats per state
    FL/  TX/  GA/  …        # same 4 files per state
  florida/                  # FL product + LEI mapping work
  texas/ georgia/ …         # product slices (see docs/HMDA-*-EXPANSION.md)
  cleaned/                  # legacy multi-state extract
  README.md
```

## Extract / activate a state

```bash
# Rebuild everything from raw national file
python scripts/process_hmda_national.py year_2025.csv

# Point product code at a partition
#   data/hmda/by-state/AZ/
# or copy with aliases:
python scripts/extract_hmda_state.py AZ --out data/hmda/arizona
python scripts/extract_hmda_state.py FL
```

State folders under `by-state/{ST}/` use the same schemas as existing evidence panels.

## Product slices (existing live work)

Keep using dedicated expansion docs/scripts until migrated to `by-state/`:

| Slice | Docs / rebuild |
|-------|----------------|
| Florida | `florida/` + `lei_to_nmls_mapping.csv` |
| Texas | `docs/HMDA-TEXAS-EXPANSION.md` · `build-hmda-texas-slice.py` |
| Georgia | `docs/HMDA-GEORGIA-EXPANSION.md` · `build-hmda-georgia-slice.py` |
| California | `docs/HMDA-CALIFORNIA-EXPANSION.md` · `build-hmda-california-slice.py` |
| North Carolina | `docs/HMDA-NORTH-CAROLINA-EXPANSION.md` · `build-hmda-north-carolina-slice.py` |
| South Carolina | `docs/HMDA-SOUTH-CAROLINA-EXPANSION.md` · `build-hmda-south-carolina-slice.py` |
| New Jersey | `docs/HMDA-NEW-JERSEY-EXPANSION.md` · `build-hmda-new-jersey-slice.py` |
| New York | `docs/HMDA-NEW-YORK-EXPANSION.md` · `build-hmda-new-york-slice.py` |
| Pennsylvania | `docs/HMDA-PENNSYLVANIA-EXPANSION.md` · `build-hmda-pennsylvania-slice.py` |
| Massachusetts | `docs/HMDA-MASSACHUSETTS-EXPANSION.md` · `build-hmda-massachusetts-slice.py` |
| Rhode Island · Vermont · Maine | `docs/HMDA-RI-VT-ME-EXPANSION.md` · `build-hmda-ri-vt-me-slices.py` |

National partitions for these states match the earlier multi-state extract (e.g. FL Miami-Dade originations 34,236).

## Live rollout priority flags

`priority_market=yes` on: **CA, DC, FL, GA, MA, NC, NJ, NY, PA, SC, TN, TX**  
Other states: `priority_market=national` until activated on the site.

## Column notes

- **Applications:** non-purchase HMDA rows with valid geography  
- **Originations:** `action_taken = 1`  
- **Denials:** `action_taken = 3`  
- **Loan types:** Conventional / FHA / VA / USDA+other  
- **Purchase vs refinance:** `loan_purpose` 1 vs 31/32  
- **institution_name / nmls_id:** empty until LEI mapping  

## Compatibility

Column names align with the multi-state pipeline so loaders and LEI mapping scripts work when pointed at:

- `data/hmda/by-state/FL/…` or  
- `data/hmda/national/…` with a state filter  

## Do not

- Commit `year_2025.csv`  
- Invent Trust Scores or force LEI→NMLS matches  
- Delete working product slices until product code is switched to `by-state/`  
