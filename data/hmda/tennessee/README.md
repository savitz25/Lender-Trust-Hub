# Tennessee HMDA slice (deepened)

**Source:** `data/hmda/by-state/TN/` (national foundation)

**Phase:** tennessee-deepen

- County market rows: **39**
- Lender–county activity (major markets): **9660**
- LEI state summaries: **1141**
- High-confidence LEI→directory mappings: **230**
- Major markets with names: **35**
- Top-20 mapped: **20/20** · Top-50 mapped: **44/50**

## Top mapped LEIs by TN originations

- `rocket-mortgage` — Rocket Mortgage, LLC (11919 TN orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (8992 TN orig.)
- `regions-bank` — Regions Bank (5322 TN orig.)
- `firstbank-tennessee` — FirstBank (4089 TN orig.)
- `amerihome-mortgage` — AmeriHome Mortgage Company, LLC (3925 TN orig.)
- `veterans-united-west-valley` — MORTGAGE RESEARCH CENTER, LLC (3178 TN orig.)
- `mortgage-investors-group-knoxville` — MORTGAGE INVESTORS GROUP, INC. (3148 TN orig.)
- `eastman-credit-union` — EASTMAN CREDIT UNION (2854 TN orig.)
- `pinnacle-bank` — Pinnacle Bank (2808 TN orig.)
- `pennymac` — PENNYMAC LOAN SERVICES, LLC (2566 TN orig.)
- `first-horizon-bank` — First Horizon Bank (2513 TN orig.)
- `first-community-mortgage` — FIRST COMMUNITY MORTGAGE, INC. (2461 TN orig.)
- `freedom-mortgage` — FREEDOM MORTGAGE CORPORATION (2436 TN orig.)
- `crosscountry-mortgage-charlotte` — CROSSCOUNTRY MORTGAGE, LLC (2251 TN orig.)
- `movement-mortgage-charlotte` — MOVEMENT MORTGAGE, LLC (2207 TN orig.)
- `dhi-mortgage-buckeye` — DHI MORTGAGE COMPANY, LTD. (2122 TN orig.)
- `truist-bank` — Truist Bank (2014 TN orig.)
- `loandepot` — LOANDEPOT.COM, LLC (1915 TN orig.)
- `navy-federal-jacksonville` — Navy Federal Credit Union (1902 TN orig.)
- `guaranteed-rate` — GUARANTEED RATE, INC. (1868 TN orig.)
- `us-bank` — U.S. Bank National Association (1844 TN orig.)
- `knoxville-tva-employees-credit-union` — KNOXVILLE TVA EMPLOYEES CREDIT UNION (1808 TN orig.)
- `ascend-federal-credit-union` — ASCEND FEDERAL CREDIT UNION (1801 TN orig.)
- `cadence-bank` — Cadence Bank (1772 TN orig.)
- `fairway-mortgage-augusta-sheppard` — FAIRWAY INDEPENDENT MORTGAGE CORPORATION (1593 TN orig.)
- `new-american-funding` — NEW AMERICAN FUNDING, LLC (1519 TN orig.)
- `silverton-mortgage-myrtle-beach` — VANDERBILT MORTGAGE AND FINANCE, INC. (1509 TN orig.)
- `leaders-credit-union` — Leaders Credit Union (1505 TN orig.)
- `bank-of-america-mortgage-north-dfw` — Bank of America, National Association (1499 TN orig.)
- `mr-cooper` — NATIONSTAR MORTGAGE LLC (1452 TN orig.)

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
- **Roane** (`47145`) — 1729 originations
- **Dickson** (`47043`) — 1719 originations
- **Greene** (`47059`) — 1719 originations
- **Hamblen** (`47063`) — 1608 originations
- **Jefferson** (`47089`) — 1587 originations
- **Cumberland** (`47035`) — 1515 originations
- **Coffee** (`47031`) — 1447 originations
- **Tipton** (`47167`) — 1405 originations
- **McMinn** (`47107`) — 1309 originations
- **Cheatham** (`47021`) — 1295 originations
- **Hickman** (`47047`) — 1267 originations
- **Bedford** (`47003`) — 1251 originations
- **Hawkins** (`47073`) — 1248 originations
- **Marshall** (`47117`) — 1246 originations
- **Gibson** (`47053`) — 1200 originations

## Matching rules

- Reuse prior product-state curated LEI maps when LEI has TN activity
- **tn_deepen** GLEIF re-identification overrides corrupted identity swaps
- Prefer TN hosts (FirstBank, MIG, Pinnacle, Churchill Nashville, Eastman, Leaders, ORNL)
- Precision over coverage — low-confidence regionals deferred

## Rebuild

```bash
python scripts/build-hmda-tennessee-deepen.py
```
