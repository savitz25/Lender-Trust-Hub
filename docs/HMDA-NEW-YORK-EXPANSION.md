# HMDA New York expansion

**Vintage:** 2025  
**Source:** `data/hmda/by-state/NY/` (from `year_2025.csv` national foundation)  
**Product slice:** `data/hmda/new-york/`

## Activate / rebuild

```bash
python scripts/process_hmda_national.py year_2025.csv   # if partition missing
python scripts/build-hmda-new-york-slice.py
```

## What goes live

| Surface | Behavior |
|---------|----------|
| `/local-lenders/new-york/{county}` | County market panel for major counties |
| `/lenders/{slug}` | NY originations when LEI mapped |
| Loan Estimate Analyzer | `ny:{county}` prefill options |

## Major counties

### Wave 1
Suffolk, Nassau, Erie, Monroe, Queens, Kings, Westchester, Onondaga, New York County / Manhattan (`new-york-county`), Orange, Albany, Richmond, Dutchess, Saratoga, Rockland, Bronx, Niagara, Oneida, Schenectady, Rensselaer, Ulster, Broome

### Deepen
**Hudson Valley / downstate spillover:** Putnam, Sullivan, Columbia, Greene  

**Finger Lakes / Central / North Country / Southern Tier:** Ontario, Oswego, Wayne, Jefferson, Steuben, Chautauqua, Chemung, Warren, Madison, Cayuga, Tompkins, Livingston, Herkimer, Washington, Genesee, St. Lawrence, Fulton, Clinton, Cattaraugus, Montgomery, Tioga, Otsego

**Slug note:** HMDA names Manhattan as “New York” county; the directory URL is `/local-lenders/new-york/new-york-county`. Loaders map FIPS `36061` → `new-york-county`.

## Matching

- Reuse prior product-state curated LEI maps when LEI has NY activity  
- NY curated deepen (GLEIF + published company NMLS + directory host):
  - Premium Mortgage, Homestead Funding, Nationwide Mortgage Bankers (NMB), Contour Mortgage, NBT Bank, Plaza Home Mortgage, 1st Priority Mortgage, FM Home Loans  
- Precision only — no low-confidence inventing  
- See `data/hmda/new-york/README.md` for mapping counts  

## Intentionally deferred

- Full 62-county activity panels (smallest rural counties remain market-summary only)  
- Credit unions / regionals without a clean public company NMLS + directory host (e.g. ESL FCU, Broadview FCU, KeyBank NMLS collision risk with Flagstar, Community Bank N.A. pending verified company NMLS)  
- Inventing thin local branch profiles solely for coverage  

## Stability

Does not modify FL/TX/GA/CA/NC/SC/NJ product folders. PA reuse maps are read-only when present.
