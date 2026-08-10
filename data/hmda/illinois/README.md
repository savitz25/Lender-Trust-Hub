# Illinois HMDA slice

**Source:** `data/hmda/by-state/IL/` (national 2025 foundation)

- County market rows: **30**
- Lender–county activity (major markets): **5995**
- LEI state summaries: **1037**
- High-confidence LEI→directory mappings: **113**
- Major markets with names: **20**

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
- `pnc-bank` — PNC Bank, National Association (3711 IL orig.)
- `new-american-funding` — Broker Solutions, Inc. (3581 IL orig.)
- `movement-mortgage-myrtle-beach` — Movement Mortgage, LLC (2965 IL orig.)
- `guaranteed-rate` — Guaranteed Rate, Inc. (2889 IL orig.)
- `ally-bank` — Ally Bank (2870 IL orig.)
- `cefcu` — CITIZENS EQUITY FIRST CREDIT UNION (2769 IL orig.)
- `fairway-mortgage-augusta-sheppard` — Fairway Independent Mortgage Corporation (2485 IL orig.)
- `american-pacific-mortgage-inland-empire` — AMERICAN PACIFIC MORTGAGE CORPORATION (2402 IL orig.)
- `old-national-bank` — Old National Bank (2207 IL orig.)

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

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has state activity
- IL/OH curated: GreenState CU, CEFCU, Old National, Flat Branch, Union Savings Bank, Wright-Patt CU, Ruoff Mortgage, KeyBank
- No fuzzy LEI inventing

## Rebuild

```bash
python scripts/build-hmda-il-oh-slices.py
```

## Major slugs (for states.ts)

```
'cook', 'dupage', 'will', 'lake', 'kane', 'mchenry', 'madison', 'winnebago', 'st-clair', 'sangamon', 'kendall', 'peoria', 'mclean', 'champaign', 'tazewell', 'rock-island', 'dekalb', 'kankakee', 'lasalle', 'macon'
```
