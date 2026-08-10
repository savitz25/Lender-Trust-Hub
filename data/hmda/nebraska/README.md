# Nebraska HMDA slice

**Source:** `data/hmda/by-state/NE/` (national 2025 foundation)

- County market rows: **14**
- Lender–county activity (major markets): **1933**
- LEI state summaries: **491**
- High-confidence LEI→directory mappings: **117**
- Major markets with names: **14**

## Top mapped LEIs by NE originations

- `pinnacle-bank-nebraska` — Pinnacle Bank (2875 NE orig.)
- `rocket-mortgage` — Rocket Mortgage, LLC (2480 NE orig.)
- `first-national-bank-of-omaha` — First National Bank of Omaha (1773 NE orig.)
- `west-gate-bank` — WEST GATE BANK (1724 NE orig.)
- `charter-west-bank` — CHARTER WEST BANK (1606 NE orig.)
- `veridian-credit-union` — VERIDIAN CREDIT UNION (1444 NE orig.)
- `union-bank-and-trust-nebraska` — Union Bank and Trust Company (1373 NE orig.)
- `centris-federal-credit-union` — CENTRIS FEDERAL CREDIT UNION (1318 NE orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (1211 NE orig.)
- `us-bank` — U.S. Bank National Association (1112 NE orig.)
- `lincoln-fsb-of-nebraska` — Lincoln FSB of Nebraska (1077 NE orig.)
- `veterans-united-west-valley` — MORTGAGE RESEARCH CENTER, LLC (950 NE orig.)
- `amerihome-mortgage` — AmeriHome Mortgage Company, LLC (701 NE orig.)
- `fairway-mortgage-augusta-sheppard` — FAIRWAY INDEPENDENT MORTGAGE CORPORATION (687 NE orig.)
- `metro-credit-union-nebraska` — METRO CU (633 NE orig.)
- `pennymac` — PENNYMAC LOAN SERVICES, LLC (611 NE orig.)
- `guaranteed-rate` — GUARANTEED RATE, INC. (558 NE orig.)
- `guild-mortgage-metrowest` — GUILD MORTGAGE COMPANY LLC (468 NE orig.)
- `cobalt-credit-union` — Cobalt Credit Union (423 NE orig.)
- `freedom-mortgage` — FREEDOM MORTGAGE CORPORATION (419 NE orig.)

## Major markets (panel-ready)

- **Douglas** (`31055`) — 14294 originations
- **Lancaster** (`31109`) — 7800 originations
- **Sarpy** (`31153`) — 6142 originations
- **Hall** (`31079`) — 1224 originations
- **Dodge** (`31053`) — 899 originations
- **Buffalo** (`31019`) — 880 originations
- **Cass** (`31025`) — 831 originations
- **Lincoln** (`31111`) — 690 originations
- **Platte** (`31141`) — 676 originations
- **Saunders** (`31155`) — 619 originations
- **Washington** (`31177`) — 555 originations
- **Madison** (`31119`) — 553 originations
- **Adams** (`31001`) — 549 originations
- **Scotts Bluff** (`31157`) — 407 originations

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has state activity
- IA/KS/NE curated: GLEIF-reidentified nationals + Plains regionals (GreenState, Veridian, Hills Bank, Dupaco, Capitol Federal, CUA, Meritrust, Pinnacle Bank NE, FNBO, West Gate, Union Bank & Trust, Centris, etc.)
- Precision only — no low-confidence LEI inventing

## Rebuild

```bash
python scripts/build-hmda-ia-ks-ne-slices.py
```

## Major slugs (for states.ts)

```
'douglas', 'lancaster', 'sarpy', 'hall', 'dodge', 'buffalo', 'cass', 'lincoln', 'platte', 'saunders', 'washington', 'madison', 'adams', 'scotts-bluff'
```
