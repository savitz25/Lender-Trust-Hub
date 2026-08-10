# Tennessee HMDA slice

**Source:** `data/hmda/by-state/TN/` (national 2025 foundation)

- County market rows: **45**
- Lender–county activity (major markets): **6885**
- LEI state summaries: **1141**
- High-confidence LEI→directory mappings: **124**
- Major markets with names: **20**

## Top mapped LEIs by TN originations

- `rocket-mortgage` — Rocket Mortgage, LLC (11919 TN orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (8992 TN orig.)
- `regions-bank` — Regions Bank (5322 TN orig.)
- `firstbank-tennessee` — FirstBank (4089 TN orig.)
- `amerihome-mortgage` — AmeriHome Mortgage Company, LLC (3925 TN orig.)
- `movement-mortgage-myrtle-beach` — Movement Mortgage, LLC (3178 TN orig.)
- `mortgage-investors-group-knoxville` — MORTGAGE INVESTORS GROUP, INC. (3148 TN orig.)
- `pinnacle-bank` — Pinnacle Bank (2808 TN orig.)
- `fairway-mortgage-augusta-sheppard` — Fairway Independent Mortgage Corporation (2566 TN orig.)
- `first-horizon-bank` — First Horizon Bank (2513 TN orig.)
- `first-community-mortgage` — FIRST COMMUNITY MORTGAGE, INC. (2461 TN orig.)
- `guild-mortgage-metrowest` — Guild Mortgage Company LLC (2436 TN orig.)
- `freedom-mortgage` — Freedom Mortgage Corporation (2251 TN orig.)
- `cardinal-financial` — Cardinal Financial Company, Limited Partnership (2207 TN orig.)
- `crosscountry-mortgage-metrowest` — CrossCountry Mortgage, LLC (2122 TN orig.)
- `truist-bank` — Truist Bank (2014 TN orig.)
- `pennymac` — PennyMac Loan Services, LLC (1915 TN orig.)
- `navy-federal-jacksonville` — Navy Federal Credit Union (1902 TN orig.)
- `mr-cooper` — Nationstar Mortgage LLC (1868 TN orig.)
- `us-bank` — U.S. Bank National Association (1844 TN orig.)

## Major markets (panel-ready)

- **Davidson** (`47037`) — 16327 originations
- **Shelby** (`47157`) — 14545 originations
- **Knox** (`47093`) — 13458 originations
- **Hamilton** (`47065`) — 9713 originations
- **Rutherford** (`47149`) — 9517 originations
- **Montgomery** (`47125`) — 8303 originations
- **Williamson** (`47187`) — 8206 originations
- **Sumner** (`47165`) — 6454 originations
- **Wilson** (`47189`) — 5307 originations
- **Sullivan** (`47163`) — 4205 originations
- **Blount** (`47009`) — 4181 originations
- **Maury** (`47119`) — 3710 originations
- **Washington** (`47179`) — 3415 originations
- **Sevier** (`47155`) — 3413 originations
- **Bradley** (`47011`) — 2671 originations
- **Robertson** (`47147`) — 2533 originations
- **Madison** (`47113`) — 2166 originations
- **Anderson** (`47001`) — 2105 originations
- **Loudon** (`47105`) — 1970 originations
- **Putnam** (`47141`) — 1842 originations

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has TN activity
- TN curated: FirstBank, Mortgage Investors Group, Pinnacle Bank, First Community Mortgage, Knoxville TVA Employees CU, Ascend FCU, Cadence Bank, Wilson Bank & Trust, Tennessee Valley FCU
- No fuzzy LEI inventing

## Rebuild

```bash
python scripts/build-hmda-tn-slices.py
```

## Major slugs (for states.ts)

```
'davidson', 'shelby', 'knox', 'hamilton', 'rutherford', 'montgomery', 'williamson', 'sumner', 'wilson', 'sullivan', 'blount', 'maury', 'washington', 'sevier', 'bradley', 'robertson', 'madison', 'anderson', 'loudon', 'putnam'
```
