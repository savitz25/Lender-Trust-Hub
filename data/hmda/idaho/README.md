# Idaho HMDA slice

**Source:** `data/hmda/by-state/ID/` (national 2025 foundation)

- County market rows: **24**
- Lender–county activity (major markets): **2356**
- LEI state summaries: **529**
- High-confidence LEI→directory mappings: **144**
- Major markets with names: **14**

## Top mapped LEIs by ID originations

- `idaho-central-credit-union` — IDAHO CENTRAL CREDIT UNION (9871 ID orig.)
- `rocket-mortgage` — Rocket Mortgage, LLC (3398 ID orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (3036 ID orig.)
- `premier-mortgage-resources` — PREMIER MORTGAGE RESOURCES, L.L.C. (1793 ID orig.)
- `guild-mortgage-metrowest` — GUILD MORTGAGE COMPANY LLC (1757 ID orig.)
- `us-bank` — U.S. Bank National Association (1178 ID orig.)
- `loandepot` — LOANDEPOT.COM, LLC (1119 ID orig.)
- `mountain-america-federal-credit-union` — Mountain America Federal Credit Union (1069 ID orig.)
- `glacier-bank` — Glacier Bank (977 ID orig.)
- `westmark-credit-union` — WESTMARK Credit Union (803 ID orig.)
- `amerihome-mortgage` — AmeriHome Mortgage Company, LLC (793 ID orig.)
- `movement-mortgage-myrtle-beach` — MOVEMENT MORTGAGE, LLC (787 ID orig.)
- `pennymac` — PENNYMAC LOAN SERVICES, LLC (760 ID orig.)
- `evergreen-moneysource-mortgage` — EVERGREEN MONEYSOURCE MORTGAGE COMPANY (735 ID orig.)
- `first-federal-savings-bank-twin-falls` — First Federal Savings Bank of Twin Falls (733 ID orig.)
- `fairway-mortgage-augusta-sheppard` — FAIRWAY INDEPENDENT MORTGAGE CORPORATION (707 ID orig.)
- `american-pacific-mortgage-inland-empire` — AMERICAN PACIFIC MORTGAGE CORPORATION (703 ID orig.)
- `guaranteed-rate` — GUARANTEED RATE, INC. (643 ID orig.)
- `kind-lending` — KIND LENDING, LLC (578 ID orig.)
- `potlatch-no-1-financial-credit-union` — Potlatch No. 1 Financial Credit Union (568 ID orig.)

## Major markets (panel-ready)

- **Ada** (`16001`) — 16030 originations
- **Canyon** (`16027`) — 8766 originations
- **Kootenai** (`16055`) — 5879 originations
- **Bonneville** (`16019`) — 3705 originations
- **Twin Falls** (`16083`) — 2642 originations
- **Bannock** (`16005`) — 2399 originations
- **Bonner** (`16017`) — 1602 originations
- **Bingham** (`16011`) — 1166 originations
- **Nez Perce** (`16069`) — 1029 originations
- **Jefferson** (`16051`) — 997 originations
- **Elmore** (`16039`) — 958 originations
- **Payette** (`16075`) — 900 originations
- **Latah** (`16057`) — 725 originations
- **Madison** (`16065`) — 708 originations

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has state activity
- ID/MT/WY curated: GLEIF-reidentified nationals + Mountain West regionals (Idaho Central CU, Glacier Bank, First Interstate, Stockman Bank, Opportunity Bank of Montana, Jonah Bank, UniWyo FCU, etc.)
- Precision only — no low-confidence LEI inventing

## Rebuild

```bash
python scripts/build-hmda-id-mt-wy-slices.py
```

## Major slugs (for states.ts)

```
'ada', 'canyon', 'kootenai', 'bonneville', 'twin-falls', 'bannock', 'bonner', 'bingham', 'nez-perce', 'jefferson', 'elmore', 'payette', 'latah', 'madison'
```
