# Wyoming HMDA slice

**Source:** `data/hmda/by-state/WY/` (national 2025 foundation)

- County market rows: **11**
- Lender–county activity (major markets): **1149**
- LEI state summaries: **356**
- High-confidence LEI→directory mappings: **122**
- Major markets with names: **11**

## Top mapped LEIs by WY originations

- `rocket-mortgage` — Rocket Mortgage, LLC (1170 WY orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (1008 WY orig.)
- `fairway-mortgage-augusta-sheppard` — FAIRWAY INDEPENDENT MORTGAGE CORPORATION (885 WY orig.)
- `guild-mortgage-metrowest` — GUILD MORTGAGE COMPANY LLC (692 WY orig.)
- `glacier-bank` — Glacier Bank (538 WY orig.)
- `jonah-bank-of-wyoming` — Jonah Bank of Wyoming (440 WY orig.)
- `uniwyo-federal-credit-union` — UNIWYO FEDERAL CREDIT UNION (383 WY orig.)
- `first-interstate-bank` — First Interstate Bank (306 WY orig.)
- `meridian-trust-federal-credit-union` — Meridian Trust Federal Credit Union (306 WY orig.)
- `veterans-united-west-valley` — MORTGAGE RESEARCH CENTER, LLC (280 WY orig.)
- `wyhy-federal-credit-union` — WYHY (252 WY orig.)
- `pinnacle-bank-wyoming` — Pinnacle Bank - Wyoming (244 WY orig.)
- `freedom-mortgage` — FREEDOM MORTGAGE CORPORATION (242 WY orig.)
- `crosscountry-mortgage-metrowest` — CROSSCOUNTRY MORTGAGE, LLC (207 WY orig.)
- `pennymac` — PENNYMAC LOAN SERVICES, LLC (185 WY orig.)
- `blue-federal-credit-union` — Blue Federal Credit Union (171 WY orig.)
- `us-bank` — U.S. Bank National Association (168 WY orig.)
- `newrez` — Newrez LLC (147 WY orig.)
- `amerihome-mortgage` — AmeriHome Mortgage Company, LLC (146 WY orig.)
- `american-pacific-mortgage-inland-empire` — AMERICAN PACIFIC MORTGAGE CORPORATION (142 WY orig.)

## Major markets (panel-ready)

- **Laramie** (`56021`) — 3333 originations
- **Natrona** (`56025`) — 2332 originations
- **Campbell** (`56005`) — 920 originations
- **Sweetwater** (`56037`) — 786 originations
- **Albany** (`56001`) — 778 originations
- **Sheridan** (`56033`) — 699 originations
- **Park** (`56029`) — 637 originations
- **Fremont** (`56013`) — 555 originations
- **Lincoln** (`56023`) — 537 originations
- **Uinta** (`56041`) — 416 originations
- **Teton** (`56039`) — 364 originations

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
'laramie', 'natrona', 'campbell', 'sweetwater', 'albany', 'sheridan', 'park', 'fremont', 'lincoln', 'uinta', 'teton'
```
