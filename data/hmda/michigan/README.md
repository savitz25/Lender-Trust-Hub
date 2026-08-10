# Michigan HMDA slice

**Source:** `data/hmda/by-state/MI/` (national 2025 foundation)

- County market rows: **41**
- Lender–county activity (major markets): **5681**
- LEI state summaries: **857**
- High-confidence LEI→directory mappings: **129**
- Major markets with names: **20**

## Top mapped LEIs by MI originations

- `rocket-mortgage` — Rocket Mortgage, LLC (22693 MI orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (22015 MI orig.)
- `lake-michigan-credit-union` — LAKE MICHIGAN CREDIT UNION (12864 MI orig.)
- `huntington-national-bank` — The Huntington National Bank (10932 MI orig.)
- `eagle-home-mortgage` — Eagle Home Mortgage, LLC (6106 MI orig.)
- `union-home-mortgage-reeves-team` — UNION HOME MORTGAGE CORP. (4118 MI orig.)
- `citizens-bank` — Citizens Bank, National Association (3697 MI orig.)
- `mortgage-1` — MORTGAGE 1 INCORPORATED (3342 MI orig.)
- `jpmorgan-chase-bank` — JPMorgan Chase Bank, National Association (2995 MI orig.)
- `dfcu-financial` — DFCU FINANCIAL (2985 MI orig.)
- `pnc-bank` — PNC Bank, National Association (2885 MI orig.)
- `genisys-credit-union` — Genisys Credit Union (2770 MI orig.)
- `flagstar-bank` — Flagstar Bank, National Association (2677 MI orig.)
- `msufcu` — MICHIGAN STATE UNIVERSITY Federal Credit Union (2551 MI orig.)
- `movement-mortgage-myrtle-beach` — Movement Mortgage, LLC (2334 MI orig.)
- `freedom-mortgage` — Freedom Mortgage Corporation (2327 MI orig.)
- `guaranteed-rate` — Guaranteed Rate, Inc. (1939 MI orig.)
- `first-merchants-bank` — First Merchants Bank (1861 MI orig.)
- `newrez` — Newrez LLC (1723 MI orig.)
- `mr-cooper` — Nationstar Mortgage LLC (1707 MI orig.)

## Major markets (panel-ready)

- **Wayne** (`26163`) — 33666 originations
- **Oakland** (`26125`) — 31664 originations
- **Macomb** (`26099`) — 21473 originations
- **Kent** (`26081`) — 16640 originations
- **Genesee** (`26049`) — 8751 originations
- **Ottawa** (`26139`) — 7794 originations
- **Washtenaw** (`26161`) — 7140 originations
- **Kalamazoo** (`26077`) — 6162 originations
- **Livingston** (`26093`) — 5580 originations
- **Ingham** (`26065`) — 5496 originations
- **Muskegon** (`26121`) — 4775 originations
- **St. Clair** (`26147`) — 4320 originations
- **Monroe** (`26115`) — 4125 originations
- **Berrien** (`26021`) — 4011 originations
- **Jackson** (`26075`) — 3600 originations
- **Saginaw** (`26145`) — 3495 originations
- **Allegan** (`26005`) — 3398 originations
- **Calhoun** (`26025`) — 3152 originations
- **Grand Traverse** (`26055`) — 2514 originations
- **Eaton** (`26045`) — 2482 originations

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has state activity
- MI/IN curated: Lake Michigan CU, Mortgage 1, DFCU, Genisys, MSUFCU, First Merchants, GVC Mortgage, 3Rivers FCU, 1st Source, German American, Centier, Lake City Bank
- First Merchants uses LEI identity (no forced company NMLS inventing)
- No fuzzy LEI inventing

## Rebuild

```bash
python scripts/build-hmda-mi-in-slices.py
```

## Major slugs (for states.ts)

```
'wayne', 'oakland', 'macomb', 'kent', 'genesee', 'ottawa', 'washtenaw', 'kalamazoo', 'livingston', 'ingham', 'muskegon', 'st-clair', 'monroe', 'berrien', 'jackson', 'saginaw', 'allegan', 'calhoun', 'grand-traverse', 'eaton'
```
