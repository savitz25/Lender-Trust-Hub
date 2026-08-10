# Washington HMDA slice

**Source:** `data/hmda/by-state/WA/` (national 2025 foundation)

- County market rows: **24**
- Lender–county activity (major markets): **5066**
- LEI state summaries: **714**
- High-confidence LEI→directory mappings: **141**
- Major markets with names: **18**

## Top mapped LEIs by WA originations

- `boeing-employees-credit-union` — Boeing Employees Credit Union (13589 WA orig.)
- `rocket-mortgage` — Rocket Mortgage, LLC (10611 WA orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (10462 WA orig.)
- `amerihome-mortgage` — AmeriHome Mortgage Company, LLC (5796 WA orig.)
- `guild-mortgage-metrowest` — GUILD MORTGAGE COMPANY LLC (5691 WA orig.)
- `movement-mortgage-myrtle-beach` — MOVEMENT MORTGAGE, LLC (5559 WA orig.)
- `crosscountry-mortgage-metrowest` — CROSSCOUNTRY MORTGAGE, LLC (4877 WA orig.)
- `us-bank` — U.S. Bank National Association (3524 WA orig.)
- `bank-of-america-mortgage-west-valley` — Bank of America, National Association (3420 WA orig.)
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
'king', 'pierce', 'snohomish', 'spokane', 'clark', 'thurston', 'kitsap', 'benton', 'whatcom', 'yakima', 'cowlitz', 'skagit', 'island', 'lewis', 'mason', 'grant', 'grays-harbor', 'franklin'
```
