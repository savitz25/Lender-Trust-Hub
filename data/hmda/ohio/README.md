# Ohio HMDA slice

**Source:** `data/hmda/by-state/OH/` (national 2025 foundation)

- County market rows: **61**
- Lender–county activity (major markets): **9916**
- LEI state summaries: **977**
- High-confidence LEI→directory mappings: **129**
- Major markets with names: **40**

## Top mapped LEIs by OH originations

- `huntington-national-bank` — The Huntington National Bank (24819 OH orig.)
- `rocket-mortgage` — Rocket Mortgage, LLC (16656 OH orig.)
- `eagle-home-mortgage` — Eagle Home Mortgage, LLC (12389 OH orig.)
- `freedom-mortgage` — Freedom Mortgage Corporation (11011 OH orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (10425 OH orig.)
- `prmi-aaron-swenson` — Primary Residential Mortgage, Inc. (7970 OH orig.)
- `pnc-bank` — PNC Bank, National Association (6725 OH orig.)
- `union-savings-bank` — Union Savings Bank (5594 OH orig.)
- `union-home-mortgage-reeves-team` — UNION HOME MORTGAGE CORP. (5380 OH orig.)
- `wright-patt-credit-union` — WRIGHT-PATT CREDIT UNION, INC. (5207 OH orig.)
- `citizens-bank` — Citizens Bank, National Association (4732 OH orig.)
- `jpmorgan-chase-bank` — JPMorgan Chase Bank, National Association (4171 OH orig.)
- `us-bank` — U.S. Bank National Association (3965 OH orig.)
- `pennymac` — PennyMac Loan Services, LLC (3505 OH orig.)
- `nfm-lending` — NFM, INC. (3308 OH orig.)
- `movement-mortgage-myrtle-beach` — Movement Mortgage, LLC (3302 OH orig.)
- `wesbanco-bank` — WesBanco Bank, Inc. (3020 OH orig.)
- `fairway-mortgage-augusta-sheppard` — Fairway Independent Mortgage Corporation (2964 OH orig.)
- `first-financial-bank-ohio` — First Financial Bank (2850 OH orig.)
- `mr-cooper` — Nationstar Mortgage LLC (2795 OH orig.)

## Major markets (panel-ready)

- **Franklin** (`39049`) — 29514 originations
- **Cuyahoga** (`39035`) — 28056 originations
- **Hamilton** (`39061`) — 19310 originations
- **Summit** (`39153`) — 13451 originations
- **Montgomery** (`39113`) — 12884 originations
- **Butler** (`39017`) — 9669 originations
- **Stark** (`39151`) — 9297 originations
- **Lucas** (`39095`) — 8905 originations
- **Lorain** (`39093`) — 8820 originations
- **Warren** (`39165`) — 7683 originations
- **Delaware** (`39041`) — 7607 originations
- **Lake** (`39085`) — 6378 originations
- **Clermont** (`39025`) — 6239 originations
- **Mahoning** (`39099`) — 5210 originations
- **Licking** (`39089`) — 5188 originations
- **Medina** (`39103`) — 5173 originations
- **Fairfield** (`39045`) — 4728 originations
- **Trumbull** (`39155`) — 4424 originations
- **Greene** (`39057`) — 4403 originations
- **Portage** (`39133`) — 3623 originations
- **Clark** (`39023`) — 3309 originations
- **Wood** (`39173`) — 2998 originations
- **Miami** (`39109`) — 2995 originations
- **Richland** (`39139`) — 2688 originations
- **Union** (`39159`) — 2549 originations
- **Geauga** (`39055`) — 2526 originations
- **Allen** (`39003`) — 2367 originations
- **Wayne** (`39169`) — 2303 originations
- **Muskingum** (`39119`) — 2169 originations
- **Ashtabula** (`39007`) — 2097 originations
- **Columbiana** (`39029`) — 1950 originations
- **Pickaway** (`39129`) — 1893 originations
- **Hancock** (`39063`) — 1676 originations
- **Knox** (`39083`) — 1619 originations
- **Erie** (`39043`) — 1581 originations
- **Ross** (`39141`) — 1492 originations
- **Marion** (`39101`) — 1360 originations
- **Tuscarawas** (`39157`) — 1351 originations
- **Madison** (`39097`) — 1276 originations
- **Sandusky** (`39143`) — 1262 originations

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
'franklin', 'cuyahoga', 'hamilton', 'summit', 'montgomery', 'butler', 'stark', 'lucas', 'lorain', 'warren', 'delaware', 'lake', 'clermont', 'mahoning', 'licking', 'medina', 'fairfield', 'trumbull', 'greene', 'portage', 'clark', 'wood', 'miami', 'richland', 'union', 'geauga', 'allen', 'wayne', 'muskingum', 'ashtabula', 'columbiana', 'pickaway', 'hancock', 'knox', 'erie', 'ross', 'marion', 'tuscarawas', 'madison', 'sandusky'
```
