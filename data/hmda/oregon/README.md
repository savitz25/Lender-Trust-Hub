# Oregon HMDA slice (deepened)

**Source:** `data/hmda/by-state/OR/` (national foundation)

**Phase:** oregon-deepen

- County market rows: **27**
- Lender–county activity (major markets): **5415**
- LEI state summaries: **629**
- High-confidence LEI→directory mappings: **180**
- Major markets with names: **27**
- Top-20 mapped: **19/20** · Top-50 mapped: **45/50**

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
- `first-community-credit-union-oregon` — FIRST COMMUNITY (1177 OR orig.)
- `fairway-mortgage-augusta-sheppard` — FAIRWAY INDEPENDENT MORTGAGE CORPORATION (1175 OR orig.)
- `selco-community-credit-union` — SELCO COMMUNITY (1167 OR orig.)
- `mortgage-express` — MORTGAGE EXPRESS, LLC (1084 OR orig.)
- `guaranteed-rate` — GUARANTEED RATE, INC. (1065 OR orig.)
- `bank-of-america-mortgage-west-valley` — Bank of America, National Association (1044 OR orig.)
- `movement-mortgage-myrtle-beach` — MOVEMENT MORTGAGE, LLC (906 OR orig.)
- `kind-lending` — KIND LENDING, LLC (864 OR orig.)
- `american-pacific-mortgage-inland-empire` — AMERICAN PACIFIC MORTGAGE CORPORATION (860 OR orig.)
- `veterans-united-west-valley` — MORTGAGE RESEARCH CENTER, LLC (838 OR orig.)
- `oregon-state-credit-union` — Oregon State Credit Union (831 OR orig.)
- `cmg-home-loans-dennis-vo` — CMG Mortgage, Inc. (815 OR orig.)
- `jpmorgan-chase-bank` — JPMorgan Chase Bank, National Association (811 OR orig.)
- `maps-credit-union` — MARION AND POLK SCHOOLS CREDIT UNION (791 OR orig.)
- `banner-bank` — Banner Bank (786 OR orig.)
- `union-home-mortgage-reeves-team` — UNION HOME MORTGAGE CORP. (722 OR orig.)

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
- **Clatsop** (`41007`) — 1004 originations
- **Crook** (`41013`) — 899 originations
- **Tillamook** (`41057`) — 825 originations
- **Jefferson** (`41031`) — 646 originations
- **Union** (`41061`) — 516 originations
- **Wasco** (`41065`) — 489 originations
- **Malheur** (`41045`) — 452 originations
- **Curry** (`41015`) — 441 originations
- **Hood River** (`41027`) — 382 originations

## Matching rules

- Reuse prior product-state curated LEI maps when LEI has OR activity
- **or_deepen** GLEIF re-identification + OR directory hosts
- Precision over coverage — low-confidence regionals deferred

## Rebuild

```bash
python scripts/build-hmda-oregon-deepen.py
```
