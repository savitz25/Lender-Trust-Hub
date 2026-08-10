# Washington HMDA slice (deepened)

**Source:** `data/hmda/by-state/WA/` (national foundation)

**Phase:** washington-deepen

- County market rows: **28**
- Lender–county activity (major markets): **6575**
- LEI state summaries: **714**
- High-confidence LEI→directory mappings: **170**
- Major markets with names: **28**
- Top-20 mapped: **20/20** · Top-50 mapped: **44/50**

## Top mapped LEIs by WA originations

- `boeing-employees-credit-union` — Boeing Employees Credit Union (13589 WA orig.)
- `rocket-mortgage` — Rocket Mortgage, LLC (10611 WA orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (10462 WA orig.)
- `amerihome-mortgage` — AmeriHome Mortgage Company, LLC (5796 WA orig.)
- `guild-mortgage-snohomish` — GUILD MORTGAGE COMPANY LLC (5691 WA orig.)
- `movement-mortgage-myrtle-beach` — MOVEMENT MORTGAGE, LLC (5559 WA orig.)
- `crosscountry-mortgage-snohomish` — CROSSCOUNTRY MORTGAGE, LLC (4877 WA orig.)
- `us-bank` — U.S. Bank National Association (3524 WA orig.)
- `bank-of-america-mortgage-snohomish` — Bank of America, National Association (3420 WA orig.)
- `pennymac` — PENNYMAC LOAN SERVICES, LLC (2953 WA orig.)
- `jpmorgan-chase-bank` — JPMorgan Chase Bank, National Association (2816 WA orig.)
- `newrez` — Newrez LLC (2702 WA orig.)
- `evergreen-moneysource-mortgage` — EVERGREEN MONEYSOURCE MORTGAGE COMPANY (2680 WA orig.)
- `fairway-mortgage-augusta-sheppard` — FAIRWAY INDEPENDENT MORTGAGE CORPORATION (2480 WA orig.)
- `navy-federal-jacksonville` — Navy Federal Credit Union (2289 WA orig.)
- `loandepot` — LOANDEPOT.COM, LLC (2113 WA orig.)
- `washington-state-employees-credit-union` — WASHINGTON STATE EMPLOYEES CREDIT UNION (2088 WA orig.)
- `gesa-credit-union` — GESA CREDIT UNION (2070 WA orig.)
- `spokane-teachers-credit-union` — SPOKANE TEACHERS (1963 WA orig.)
- `american-pacific-mortgage-inland-empire` — AMERICAN PACIFIC MORTGAGE CORPORATION (1911 WA orig.)
- `guaranteed-rate` — GUARANTEED RATE, INC. (1847 WA orig.)
- `columbia-bank-pnw` — Columbia Bank (1846 WA orig.)
- `banner-bank` — Banner Bank (1842 WA orig.)
- `new-american-funding` — NEW AMERICAN FUNDING, LLC (1680 WA orig.)
- `dhi-mortgage-buckeye` — DHI MORTGAGE COMPANY, LTD. (1626 WA orig.)
- `veterans-united-snohomish` — MORTGAGE RESEARCH CENTER, LLC (1561 WA orig.)
- `freedom-mortgage` — FREEDOM MORTGAGE CORPORATION (1518 WA orig.)
- `wells-fargo-bank` — Wells Fargo Bank, National Association (1514 WA orig.)
- `first-security-bank-washington` — 1st Security Bank of Washington (1432 WA orig.)
- `mr-cooper` — NATIONSTAR MORTGAGE LLC (1403 WA orig.)

## Major markets (panel-ready)

- **King** (`53033`) — 43300 originations
- **Pierce** (`53053`) — 22920 originations
- **Snohomish** (`53061`) — 19763 originations
- **Spokane** (`53063`) — 13448 originations
- **Clark** (`53011`) — 12785 originations
- **Thurston** (`53067`) — 7770 originations
- **Kitsap** (`53035`) — 7286 originations
- **Benton** (`53005`) — 5498 originations
- **Whatcom** (`53073`) — 4775 originations
- **Yakima** (`53077`) — 4226 originations
- **Cowlitz** (`53015`) — 3302 originations
- **Skagit** (`53057`) — 2807 originations
- **Island** (`53029`) — 2506 originations
- **Lewis** (`53041`) — 2316 originations
- **Mason** (`53045`) — 2084 originations
- **Grant** (`53025`) — 2074 originations
- **Grays Harbor** (`53027`) — 2027 originations
- **Franklin** (`53021`) — 2013 originations
- **Chelan** (`53007`) — 1738 originations
- **Clallam** (`53009`) — 1689 originations
- **Kittitas** (`53037`) — 1371 originations
- **Walla Walla** (`53071`) — 1178 originations
- **Stevens** (`53065`) — 1054 originations
- **Douglas** (`53017`) — 1018 originations
- **Whitman** (`53075`) — 737 originations
- **Jefferson** (`53031`) — 665 originations
- **Okanogan** (`53047`) — 657 originations
- **Pacific** (`53049`) — 652 originations

## Matching rules

- Reuse prior product-state curated LEI maps when LEI has WA activity
- **wa_deepen** GLEIF re-identification + WA directory host preference
- Precision over coverage — low-confidence regionals deferred

## Rebuild

```bash
python scripts/build-hmda-washington-deepen.py
```
