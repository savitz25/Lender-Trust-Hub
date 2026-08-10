# Missouri HMDA slice

**Source:** `data/hmda/by-state/MO/` (national 2025 foundation)

- County market rows: **32**
- Lender–county activity (major markets): **4684**
- LEI state summaries: **908**
- High-confidence LEI→directory mappings: **121**
- Major markets with names: **18**

## Top mapped LEIs by MO originations

- `rocket-mortgage` — Rocket Mortgage, LLC (7481 MO orig.)
- `flat-branch-mortgage` — FLAT BRANCH MORTGAGE, INC. (7301 MO orig.)
- `guild-mortgage-metrowest` — GUILD MORTGAGE COMPANY LLC (5462 MO orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (5338 MO orig.)
- `central-trust-bank` — The Central Trust Bank (4768 MO orig.)
- `communityamerica-federal-credit-union` — COMMUNITYAMERICA FEDERAL CREDIT UNION (3721 MO orig.)
- `us-bank` — U.S. Bank National Association (3622 MO orig.)
- `das-acquisition-company` — DAS ACQUISITION COMPANY, LLC (3201 MO orig.)
- `veterans-united-west-valley` — MORTGAGE RESEARCH CENTER, LLC (2901 MO orig.)
- `new-american-funding` — Broker Solutions, Inc. (2619 MO orig.)
- `pennymac` — PENNYMAC LOAN SERVICES, LLC (2580 MO orig.)
- `commerce-bank` — Commerce Bank (2488 MO orig.)
- `fairway-mortgage-augusta-sheppard` — FAIRWAY INDEPENDENT MORTGAGE CORPORATION (2363 MO orig.)
- `arvest-bank` — Arvest Bank (2139 MO orig.)
- `freedom-mortgage` — FREEDOM MORTGAGE CORPORATION (1814 MO orig.)
- `bank-of-america-mortgage-west-valley` — Bank of America, National Association (1520 MO orig.)
- `primelending-columbus` — PRIMELENDING, A PLAINSCAPITAL COMPANY (1496 MO orig.)
- `mr-cooper` — NATIONSTAR MORTGAGE LLC (1406 MO orig.)
- `newrez` — Newrez LLC (1311 MO orig.)
- `regions-bank` — Regions Bank (1188 MO orig.)

## Major markets (panel-ready)

- **St. Louis** (`29189`) — 22981 originations
- **Jackson** (`29095`) — 17328 originations
- **St. Charles** (`29183`) — 11891 originations
- **Greene** (`29077`) — 7867 originations
- **Clay** (`29047`) — 7078 originations
- **Jefferson** (`29099`) — 6586 originations
- **St. Louis City** (`29510`) — 5424 originations
- **Boone** (`29019`) — 4123 originations
- **Cass** (`29037`) — 3316 originations
- **Jasper** (`29097`) — 2979 originations
- **Christian** (`29043`) — 2889 originations
- **Platte** (`29165`) — 2747 originations
- **Franklin** (`29071`) — 2455 originations
- **Cole** (`29051`) — 2058 originations
- **Camden** (`29029`) — 2030 originations
- **Buchanan** (`29021`) — 1885 originations
- **Lincoln** (`29113`) — 1827 originations
- **Cape Girardeau** (`29031`) — 1770 originations

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has state activity
- MO/KY curated: GLEIF-reidentified nationals + high-volume regionals (Flat Branch, Central Trust, CommunityAmerica, DAS Acquisition, Commerce Bank, Arvest, Stockton Mortgage, Community Trust Bank, Stock Yards, Commonwealth FCU, Republic Bank & Trust KY)
- Precision only — no low-confidence LEI inventing

## Rebuild

```bash
python scripts/build-hmda-mo-ky-slices.py
```

## Major slugs (for states.ts)

```
'st-louis', 'jackson', 'st-charles', 'greene', 'clay', 'jefferson', 'st-louis-city', 'boone', 'cass', 'jasper', 'christian', 'platte', 'franklin', 'cole', 'camden', 'buchanan', 'lincoln', 'cape-girardeau'
```
