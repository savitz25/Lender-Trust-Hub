# Hawaii HMDA slice

**Source:** `data/hmda/by-state/HI/` (national 2025 foundation)

- Market rows: **4**
- Lender–market activity (major markets): **686**
- LEI state summaries: **272**
- High-confidence LEI→directory mappings: **80**
- Major markets with names: **4**

## Top mapped LEIs by HI originations

- `bank-of-hawaii` — Bank of Hawaii (1972 HI orig.)
- `first-hawaiian-bank` — First Hawaiian Bank (1586 HI orig.)
- `american-savings-bank-hawaii` — AMERICAN SAVINGS BANK, NATIONAL ASSOCIATION (1416 HI orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (1281 HI orig.)
- `rocket-mortgage` — Rocket Mortgage, LLC (1101 HI orig.)
- `hawaii-state-federal-credit-union` — HAWAII STATE FEDERAL CREDIT UNION (847 HI orig.)
- `hawaiiusa-federal-credit-union` — HAWAIIUSA (777 HI orig.)
- `central-pacific-bank` — Central Pacific Bank (720 HI orig.)
- `freedom-mortgage` — FREEDOM MORTGAGE CORPORATION (516 HI orig.)
- `pennymac` — PENNYMAC LOAN SERVICES, LLC (462 HI orig.)
- `guaranteed-rate` — GUARANTEED RATE, INC. (443 HI orig.)
- `amerihome-mortgage` — AmeriHome Mortgage Company, LLC (399 HI orig.)
- `newrez` — Newrez LLC (392 HI orig.)
- `veterans-united-west-valley` — MORTGAGE RESEARCH CENTER, LLC (368 HI orig.)
- `loandepot` — LOANDEPOT.COM, LLC (329 HI orig.)
- `navy-federal-jacksonville` — Navy Federal Credit Union (326 HI orig.)
- `cmg-home-loans-dennis-vo` — CMG Mortgage, Inc. (326 HI orig.)
- `guild-mortgage-metrowest` — GUILD MORTGAGE COMPANY LLC (316 HI orig.)
- `dhi-mortgage-buckeye` — DHI MORTGAGE COMPANY, LTD. (263 HI orig.)
- `nfm-lending` — NFM, INC. (235 HI orig.)

## Major markets (panel-ready)

- **Honolulu** (`15003`) — 13362 originations
- **Hawaii** (`15001`) — 3347 originations
- **Maui** (`15009`) — 2057 originations
- **Kauai** (`15007`) — 1048 originations

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has activity in this state
- AK: Global FCU, Residential Mortgage LLC, First National Bank Alaska, Credit Union 1, Mt. McKinley Bank
- HI: Bank of Hawaii, First Hawaiian, American Savings Bank, Hawaii State FCU, HawaiiUSA, Central Pacific Bank
- ND: Gate City Bank, First International Bank & Trust, First Community CU, Dacotah Bank, Bravera Bank
- SD: Plains Commerce Bank, First PREMIER, Black Hills FCU, First Dakota, First Bank & Trust, Levo FCU, BankWest
- Precision over coverage — no fuzzy LEI inventing

## Rebuild

```bash
python scripts/build-hmda-final4-slices.py
```

## Major slugs (for states.ts)

```
'honolulu', 'hawaii', 'maui', 'kauai'
```
