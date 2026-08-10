# Ohio HMDA slice

**Source:** `data/hmda/by-state/OH/` (national 2025 foundation)

- County market rows: **61**
- Lender–county activity (major markets): **6403**
- LEI state summaries: **977**
- High-confidence LEI→directory mappings: **121**
- Major markets with names: **20**

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
- `fairway-mortgage-augusta-sheppard` — Fairway Independent Mortgage Corporation (2964 OH orig.)
- `mr-cooper` — Nationstar Mortgage LLC (2795 OH orig.)
- `primelending-columbus` — PrimeLending, a PlainsCapital Company (2685 OH orig.)
- `guild-mortgage-metrowest` — Guild Mortgage Company LLC (2477 OH orig.)

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
'franklin', 'cuyahoga', 'hamilton', 'summit', 'montgomery', 'butler', 'stark', 'lucas', 'lorain', 'warren', 'delaware', 'lake', 'clermont', 'mahoning', 'licking', 'medina', 'fairfield', 'trumbull', 'greene', 'portage'
```
