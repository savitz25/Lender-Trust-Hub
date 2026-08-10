# South Dakota HMDA slice

**Source:** `data/hmda/by-state/SD/` (national 2025 foundation)

- Market rows: **19**
- Lender–market activity (major markets): **1280**
- LEI state summaries: **333**
- High-confidence LEI→directory mappings: **119**
- Major markets with names: **15**

## Top mapped LEIs by SD originations

- `plains-commerce-bank` — Plains Commerce Bank (1570 SD orig.)
- `first-bank-and-trust-south-dakota` — FIRST BANK & TRUST (972 SD orig.)
- `first-premier-bank` — First PREMIER Bank (942 SD orig.)
- `rocket-mortgage` — Rocket Mortgage, LLC (753 SD orig.)
- `black-hills-federal-credit-union` — BLACK HILLS FEDERAL CREDIT UNION (738 SD orig.)
- `amerihome-mortgage` — AmeriHome Mortgage Company, LLC (689 SD orig.)
- `first-dakota-national-bank` — First Dakota National Bank (576 SD orig.)
- `levo-federal-credit-union` — Levo Federal Credit Union (541 SD orig.)
- `first-international-bank-and-trust` — First International Bank & Trust (503 SD orig.)
- `bankwest-south-dakota` — BANKWEST, INC. (494 SD orig.)
- `dacotah-bank` — Dacotah Bank (433 SD orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (426 SD orig.)
- `us-bank` — U.S. Bank National Association (392 SD orig.)
- `fairway-mortgage-augusta-sheppard` — FAIRWAY INDEPENDENT MORTGAGE CORPORATION (375 SD orig.)
- `first-interstate-bank` — First Interstate Bank (364 SD orig.)
- `veterans-united-west-valley` — MORTGAGE RESEARCH CENTER, LLC (298 SD orig.)
- `pennymac` — PENNYMAC LOAN SERVICES, LLC (187 SD orig.)
- `crosscountry-mortgage-metrowest` — CROSSCOUNTRY MORTGAGE, LLC (175 SD orig.)
- `guaranteed-rate` — GUARANTEED RATE, INC. (173 SD orig.)
- `freedom-mortgage` — FREEDOM MORTGAGE CORPORATION (162 SD orig.)

## Major markets (panel-ready)

- **Minnehaha** (`46099`) — 4705 originations
- **Pennington** (`46103`) — 2661 originations
- **Lincoln** (`46083`) — 2011 originations
- **Meade** (`46093`) — 742 originations
- **Lawrence** (`46081`) — 678 originations
- **Codington** (`46029`) — 595 originations
- **Brookings** (`46011`) — 519 originations
- **Brown** (`46013`) — 460 originations
- **Union** (`46127`) — 350 originations
- **Davison** (`46035`) — 346 originations
- **Yankton** (`46135`) — 343 originations
- **Hughes** (`46065`) — 299 originations
- **Lake** (`46079`) — 262 originations
- **Clay** (`46027`) — 244 originations
- **Butte** (`46019`) — 235 originations

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has activity in this state
- AK: Global FCU, Residential Mortgage LLC, First National Bank Alaska, Credit Union 1, Mt. McKinley Bank
- HI: Bank of Hawaii, First Hawaiian, American Savings Bank, Hawaii State FCU, HawaiiUSA, Central Pacific Bank
- ND: Gate City Bank, First International Bank & Trust, First Community CU, Dacotah Bank, Bravera Bank
- SD: Plains Commerce Bank, First PREMIER, Black Hills FCU, First Dakota, First Bank & Trust, Levo FCU, BankWest
- Precision over coverage — no fuzzy LEI inventing

## Rebuild

```bash
python scripts/build-hmda-final4-slices.py
```

## Major slugs (for states.ts)

```
'minnehaha', 'pennington', 'lincoln', 'meade', 'lawrence', 'codington', 'brookings', 'brown', 'union', 'davison', 'yankton', 'hughes', 'lake', 'clay', 'butte'
```
