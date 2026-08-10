# Illinois HMDA slice

**Source:** `data/hmda/by-state/IL/` (national 2025 foundation)

- County market rows: **33**
- Lender–county activity (major markets): **7510**
- LEI state summaries: **1037**
- High-confidence LEI→directory mappings: **118**
- Major markets with names: **32**

## Top mapped LEIs by IL originations

- `rocket-mortgage` — Rocket Mortgage, LLC (11970 IL orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (11397 IL orig.)
- `mr-cooper` — Nationstar Mortgage LLC (10217 IL orig.)
- `jpmorgan-chase-bank` — JPMorgan Chase Bank, National Association (8778 IL orig.)
- `freedom-mortgage` — Freedom Mortgage Corporation (5600 IL orig.)
- `us-bank` — U.S. Bank National Association (4571 IL orig.)
- `huntington-national-bank` — The Huntington National Bank (4352 IL orig.)
- `pennymac` — PennyMac Loan Services, LLC (4241 IL orig.)
- `primelending-columbus` — PrimeLending, a PlainsCapital Company (4215 IL orig.)
- `eagle-home-mortgage` — Eagle Home Mortgage, LLC (4111 IL orig.)
- `greenstate-credit-union` — GREENSTATE Credit Union (3954 IL orig.)
- `bmo-bank` — BMO Bank National Association (3906 IL orig.)
- `pnc-bank` — PNC Bank, National Association (3711 IL orig.)
- `new-american-funding` — Broker Solutions, Inc. (3581 IL orig.)
- `movement-mortgage-myrtle-beach` — Movement Mortgage, LLC (2965 IL orig.)
- `guaranteed-rate` — Guaranteed Rate, Inc. (2889 IL orig.)
- `ally-bank` — Ally Bank (2870 IL orig.)
- `cefcu` — CITIZENS EQUITY FIRST CREDIT UNION (2769 IL orig.)
- `wintrust-mortgage` — Barrington Bank & Trust Company, National Association (2719 IL orig.)
- `fairway-mortgage-augusta-sheppard` — Fairway Independent Mortgage Corporation (2485 IL orig.)

## Major markets (panel-ready)

- **Cook** (`17031`) — 81303 originations
- **DuPage** (`17043`) — 18219 originations
- **Will** (`17197`) — 16623 originations
- **Lake** (`17097`) — 14702 originations
- **Kane** (`17089`) — 11763 originations
- **McHenry** (`17111`) — 8411 originations
- **Madison** (`17119`) — 6489 originations
- **Winnebago** (`17201`) — 6133 originations
- **St. Clair** (`17163`) — 5770 originations
- **Sangamon** (`17167`) — 4516 originations
- **Kendall** (`17093`) — 4039 originations
- **Peoria** (`17143`) — 3551 originations
- **McLean** (`17113`) — 3473 originations
- **Champaign** (`17019`) — 3187 originations
- **Tazewell** (`17179`) — 2889 originations
- **Rock Island** (`17161`) — 2872 originations
- **DeKalb** (`17037`) — 2152 originations
- **Kankakee** (`17091`) — 2072 originations
- **LaSalle** (`17099`) — 1951 originations
- **Macon** (`17115`) — 1895 originations
- **Grundy** (`17063`) — 1248 originations
- **Williamson** (`17199`) — 1127 originations
- **Vermilion** (`17183`) — 1109 originations
- **Boone** (`17007`) — 1096 originations
- **Ogle** (`17141`) — 1001 originations
- **Henry** (`17073`) — 960 originations
- **Woodford** (`17203`) — 863 originations
- **Monroe** (`17133`) — 851 originations
- **Macoupin** (`17117`) — 834 originations
- **Whiteside** (`17195`) — 811 originations
- **Knox** (`17095`) — 797 originations
- **Adams** (`17001`) — 752 originations

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has state activity
- IL/OH curated + deepen: GreenState, CEFCU, Old National, Flat Branch, BMO, Wintrust Mortgage, Consumers CU (IL), Union Savings Bank, Wright-Patt CU, Ruoff, KeyBank, WesBanco, First Financial Bank (OH), Superior CU, KEMBA, 7 17 CU
- No fuzzy LEI inventing; KeyBank uses LEI identity (avoids Flagstar NMLS collision)

## Rebuild

```bash
python scripts/build-hmda-il-oh-slices.py
```

## Major slugs (for states.ts)

```
'cook', 'dupage', 'will', 'lake', 'kane', 'mchenry', 'madison', 'winnebago', 'st-clair', 'sangamon', 'kendall', 'peoria', 'mclean', 'champaign', 'tazewell', 'rock-island', 'dekalb', 'kankakee', 'lasalle', 'macon', 'grundy', 'williamson', 'vermilion', 'boone', 'ogle', 'henry', 'woodford', 'monroe', 'macoupin', 'whiteside', 'knox', 'adams'
```
