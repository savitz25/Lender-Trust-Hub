# Michigan HMDA slice

**Source:** `data/hmda/by-state/MI/` (national 2025 foundation)

- County market rows: **41**
- Lender–county activity (major markets): **8222**
- LEI state summaries: **857**
- High-confidence LEI→directory mappings: **136**
- Major markets with names: **35**

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
- `msgcu` — MICHIGAN SCHOOLS AND GOVERNMENT (2902 MI orig.)
- `pnc-bank` — PNC Bank, National Association (2885 MI orig.)
- `genisys-credit-union` — Genisys Credit Union (2770 MI orig.)
- `flagstar-bank` — Flagstar Bank, National Association (2677 MI orig.)
- `dart-bank` — The Dart Bank (2600 MI orig.)
- `msufcu` — MICHIGAN STATE UNIVERSITY Federal Credit Union (2551 MI orig.)
- `staunton-financial` — STAUNTON FINANCIAL, INC. (2473 MI orig.)
- `movement-mortgage-myrtle-beach` — Movement Mortgage, LLC (2334 MI orig.)
- `freedom-mortgage` — Freedom Mortgage Corporation (2327 MI orig.)
- `mercantile-bank-michigan` — Mercantile Bank (2101 MI orig.)

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
- **Lenawee** (`26091`) — 2324 originations
- **Lapeer** (`26087`) — 2268 originations
- **Bay** (`26017`) — 2131 originations
- **Van Buren** (`26159`) — 2006 originations
- **Clinton** (`26037`) — 1898 originations
- **Barry** (`26015`) — 1783 originations
- **Montcalm** (`26117`) — 1767 originations
- **Midland** (`26111`) — 1716 originations
- **Shiawassee** (`26155`) — 1675 originations
- **Ionia** (`26067`) — 1478 originations
- **St. Joseph** (`26149`) — 1462 originations
- **Newaygo** (`26123`) — 1332 originations
- **Cass** (`26027`) — 1324 originations
- **Isabella** (`26073`) — 1101 originations
- **Mecosta** (`26107`) — 1004 originations

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has state activity
- MI/IN curated + deepen: LMCU, Mortgage 1, DFCU, Genisys, MSUFCU, MSGCU, Dart Bank, Mercantile Bank, Staunton Financial, First Merchants, GVC, 3Rivers, 1st Source, German American, Centier, Lake City, Indiana Members CU, Everwise, Centra, Liberty FCU
- First Merchants uses LEI identity (no forced company NMLS inventing)
- No fuzzy LEI inventing

## Rebuild

```bash
python scripts/build-hmda-mi-in-slices.py
```

## Major slugs (for states.ts)

```
'wayne', 'oakland', 'macomb', 'kent', 'genesee', 'ottawa', 'washtenaw', 'kalamazoo', 'livingston', 'ingham', 'muskegon', 'st-clair', 'monroe', 'berrien', 'jackson', 'saginaw', 'allegan', 'calhoun', 'grand-traverse', 'eaton', 'lenawee', 'lapeer', 'bay', 'van-buren', 'clinton', 'barry', 'montcalm', 'midland', 'shiawassee', 'ionia', 'st-joseph', 'newaygo', 'cass', 'isabella', 'mecosta'
```
