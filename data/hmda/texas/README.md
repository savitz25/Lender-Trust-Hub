# Texas HMDA slice (deepened)

**Source:** `data/hmda/by-state/TX/` (national foundation)

**Phase:** texas-deepen

- County market rows: **45**
- Lender–county activity (major markets): **15522**
- LEI state summaries: **1376**
- High-confidence LEI→directory mappings: **209**
- Major markets with names: **38**
- Top-20 mapped: **19/20** · Top-50 mapped: **37/50**

## Top mapped LEIs by TX originations

- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (42285 TX orig.)
- `rocket-mortgage` — Rocket Mortgage, LLC (30579 TX orig.)
- `dhi-mortgage-buckeye` — DHI MORTGAGE COMPANY, LTD. (17748 TX orig.)
- `lennar-mortgage-north-dfw` — LENNAR MORTGAGE, LLC (15642 TX orig.)
- `amerihome-mortgage` — AmeriHome Mortgage Company, LLC (10655 TX orig.)
- `jpmorgan-chase-bank` — JPMorgan Chase Bank, National Association (9775 TX orig.)
- `loandepot` — LOANDEPOT.COM, LLC (8535 TX orig.)
- `crosscountry-mortgage-north-dfw` — CROSSCOUNTRY MORTGAGE, LLC (7734 TX orig.)
- `fairway-mortgage-augusta-sheppard` — FAIRWAY INDEPENDENT MORTGAGE CORPORATION (7468 TX orig.)
- `rbfcu-spacex-corridor` — RANDOLPH-BROOKS FEDERAL CREDIT UNION (7141 TX orig.)
- `veterans-united-north-texas` — MORTGAGE RESEARCH CENTER, LLC (6918 TX orig.)
- `guild-mortgage-north-dfw` — GUILD MORTGAGE COMPANY LLC (6877 TX orig.)
- `pennymac` — PENNYMAC LOAN SERVICES, LLC (6849 TX orig.)
- `21st-mortgage` — 21ST MORTGAGE CORPORATION (6763 TX orig.)
- `primelending-columbus` — PRIMELENDING, A PLAINSCAPITAL COMPANY (6358 TX orig.)
- `bank-of-america-mortgage-north-dfw` — Bank of America, National Association (6141 TX orig.)
- `freedom-mortgage` — FREEDOM MORTGAGE CORPORATION (5759 TX orig.)
- `new-american-funding` — NEW AMERICAN FUNDING, LLC (5508 TX orig.)
- `newrez` — Newrez LLC (4793 TX orig.)
- `navy-federal-jacksonville` — Navy Federal Credit Union (4267 TX orig.)
- `benchmark-mortgage` — ARK-LA-TEX FINANCIAL SERVICES, LLC. (4151 TX orig.)
- `kind-lending` — KIND LENDING, LLC (3781 TX orig.)
- `cadence-bank` — Cadence Bank (3639 TX orig.)
- `mr-cooper` — NATIONSTAR MORTGAGE LLC (3609 TX orig.)
- `cmg-home-loans-dennis-vo` — CMG Mortgage, Inc. (3502 TX orig.)
- `guaranteed-rate` — GUARANTEED RATE, INC. (3318 TX orig.)
- `union-home-mortgage-reeves-team` — UNION HOME MORTGAGE CORP. (3238 TX orig.)
- `prmg` — PARAMOUNT RESIDENTIAL MORTGAGE GROUP, INC. (3136 TX orig.)
- `prmg` — Paramount Residential Mortgage Group, Inc. (3108 TX orig.)
- `pnc-bank` — PNC Bank, National Association (2930 TX orig.)

## Major markets (panel-ready)

- **Harris** (`48201`) — 62628 originations
- **Bexar** (`48029`) — 36432 originations
- **Tarrant** (`48439`) — 34427 originations
- **Collin** (`48085`) — 31208 originations
- **Dallas** (`48113`) — 31057 originations
- **Denton** (`48121`) — 25930 originations
- **Travis** (`48453`) — 20143 originations
- **Montgomery** (`48339`) — 19966 originations
- **Fort Bend** (`48157`) — 17619 originations
- **Williamson** (`48491`) — 16872 originations
- **El Paso** (`48141`) — 12742 originations
- **Bell** (`48027`) — 9383 originations
- **Hidalgo** (`48215`) — 8308 originations
- **Brazoria** (`48039`) — 8014 originations
- **Galveston** (`48167`) — 7839 originations
- **Hays** (`48209`) — 7164 originations
- **Lubbock** (`48303`) — 6275 originations
- **Ellis** (`48139`) — 6165 originations
- **Kaufman** (`48257`) — 5876 originations
- **Nueces** (`48355`) — 5792 originations
- **Guadalupe** (`48187`) — 5657 originations
- **Comal** (`48091`) — 5457 originations
- **Johnson** (`48251`) — 5371 originations
- **Parker** (`48367`) — 4902 originations
- **Smith** (`48423`) — 4563 originations
- **McLennan** (`48309`) — 4509 originations
- **Midland** (`48329`) — 4345 originations
- **Cameron** (`48061`) — 4175 originations
- **Grayson** (`48181`) — 3989 originations
- **Brazos** (`48041`) — 3776 originations
- **Rockwall** (`48397`) — 3617 originations
- **Taylor** (`48441`) — 3347 originations
- **Jefferson** (`48245`) — 3157 originations
- **Ector** (`48135`) — 3100 originations
- **Webb** (`48479`) — 2900 originations
- **Bastrop** (`48021`) — 2373 originations
- **Liberty** (`48291`) — 2186 originations
- **Wichita** (`48485`) — 2066 originations

## Matching rules

- Reuse prior product-state curated LEI maps when LEI has TX activity
- **tx_deepen** GLEIF re-identification overrides corrupted early FL/TX identity swaps
- Prefer Texas directory hosts (RBFCU, Guild/CCM/Lennar/VU North TX, SSFCU national host)
- Precision over coverage — Frost, Prosperity, CUTX, Velocio, Highlands, SFMC, etc. deferred

## Rebuild

```bash
python scripts/build-hmda-texas-deepen.py
```
