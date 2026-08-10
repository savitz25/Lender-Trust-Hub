# Oregon HMDA slice

**Source:** `data/hmda/by-state/OR/` (national 2025 foundation)

- County market rows: **21**
- Lender–county activity (major markets): **4314**
- LEI state summaries: **629**
- High-confidence LEI→directory mappings: **144**
- Major markets with names: **18**

## Top mapped LEIs by OR originations

- `onpoint-community-credit-union` — ONPOINT COMMUNITY CREDIT UNION (7535 OR orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (4910 OR orig.)
- `rocket-mortgage` — Rocket Mortgage, LLC (4851 OR orig.)
- `guild-mortgage-metrowest` — GUILD MORTGAGE COMPANY LLC (4218 OR orig.)
- `us-bank` — U.S. Bank National Association (2465 OR orig.)
- `columbia-bank-pnw` — Columbia Bank (1939 OR orig.)
- `amerihome-mortgage` — AmeriHome Mortgage Company, LLC (1919 OR orig.)
- `rogue-credit-union` — ROGUE (1751 OR orig.)
- `oregon-community-credit-union` — OREGON COMMUNITY (1593 OR orig.)
- `first-tech-federal-credit-union` — FIRST TECHNOLOGY FEDERAL CREDIT UNION (1545 OR orig.)
- `pennymac` — PENNYMAC LOAN SERVICES, LLC (1517 OR orig.)
- `crosscountry-mortgage-metrowest` — CROSSCOUNTRY MORTGAGE, LLC (1515 OR orig.)
- `newrez` — Newrez LLC (1321 OR orig.)
- `loandepot` — LOANDEPOT.COM, LLC (1270 OR orig.)
- `fairway-mortgage-augusta-sheppard` — FAIRWAY INDEPENDENT MORTGAGE CORPORATION (1175 OR orig.)
- `selco-community-credit-union` — SELCO COMMUNITY (1167 OR orig.)
- `mortgage-express` — MORTGAGE EXPRESS, LLC (1084 OR orig.)
- `guaranteed-rate` — GUARANTEED RATE, INC. (1065 OR orig.)
- `bank-of-america-mortgage-west-valley` — Bank of America, National Association (1044 OR orig.)
- `movement-mortgage-myrtle-beach` — MOVEMENT MORTGAGE, LLC (906 OR orig.)

## Major markets (panel-ready)

- **Multnomah** (`41051`) — 14559 originations
- **Washington** (`41067`) — 12075 originations
- **Clackamas** (`41005`) — 9748 originations
- **Lane** (`41039`) — 7821 originations
- **Marion** (`41047`) — 6795 originations
- **Deschutes** (`41017`) — 6684 originations
- **Jackson** (`41029`) — 4731 originations
- **Linn** (`41043`) — 2864 originations
- **Yamhill** (`41071`) — 2409 originations
- **Douglas** (`41019`) — 2137 originations
- **Polk** (`41053`) — 2020 originations
- **Josephine** (`41033`) — 1719 originations
- **Umatilla** (`41059`) — 1610 originations
- **Klamath** (`41035`) — 1596 originations
- **Benton** (`41003`) — 1432 originations
- **Coos** (`41011`) — 1405 originations
- **Lincoln** (`41041`) — 1308 originations
- **Columbia** (`41009`) — 1301 originations

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has state activity
- OR/WA curated: GLEIF-reidentified nationals + PNW regionals (OnPoint, BECU, Columbia Bank, Banner Bank, WSECU, Gesa, Spokane Teachers CU, Rogue CU, First Tech, SELCO, Oregon State CU, Evergreen MoneySource, etc.)
- Precision only — no low-confidence LEI inventing

## Rebuild

```bash
python scripts/build-hmda-or-wa-slices.py
```

## Major slugs (for states.ts)

```
'multnomah', 'washington', 'clackamas', 'lane', 'marion', 'deschutes', 'jackson', 'linn', 'yamhill', 'douglas', 'polk', 'josephine', 'umatilla', 'klamath', 'benton', 'coos', 'lincoln', 'columbia'
```
