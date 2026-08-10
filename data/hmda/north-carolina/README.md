# North Carolina HMDA slice (deepened)

**Source:** `data/hmda/by-state/NC/` (national foundation)

**Phase:** north-carolina-deepen

- County market rows: **40**
- Lender–county activity (major markets): **12427**
- LEI state summaries: **1121**
- High-confidence LEI→directory mappings: **232**
- Major markets with names: **40**
- Top-20 mapped: **20/20** · Top-50 mapped: **43/50**

## Top mapped LEIs by NC originations

- `state-employees-credit-union-nc` — STATE EMPLOYEES' CREDIT UNION (27575 NC orig.)
- `rocket-mortgage` — Rocket Mortgage, LLC (18462 NC orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (13671 NC orig.)
- `movement-mortgage-charlotte` — MOVEMENT MORTGAGE, LLC (8138 NC orig.)
- `truist-bank` — Truist Bank (7920 NC orig.)
- `first-citizens-bank` — First-Citizens Bank & Trust Company (6984 NC orig.)
- `atlantic-bay-mortgage-charleston` — ATLANTIC BAY MORTGAGE GROUP, L.L.C. (6049 NC orig.)
- `dhi-mortgage-buckeye` — DHI MORTGAGE COMPANY, LTD. (5258 NC orig.)
- `navy-federal-jacksonville` — Navy Federal Credit Union (5249 NC orig.)
- `first-national-bank-of-pennsylvania` — First National Bank of Pennsylvania (5046 NC orig.)
- `bank-of-america-mortgage-north-dfw` — Bank of America, National Association (4880 NC orig.)
- `veterans-united-west-valley` — MORTGAGE RESEARCH CENTER, LLC (4769 NC orig.)
- `freedom-mortgage` — FREEDOM MORTGAGE CORPORATION (4463 NC orig.)
- `crosscountry-mortgage-charlotte` — CROSSCOUNTRY MORTGAGE, LLC (4431 NC orig.)
- `loandepot` — LOANDEPOT.COM, LLC (3969 NC orig.)
- `pennymac` — PENNYMAC LOAN SERVICES, LLC (3751 NC orig.)
- `truliant-federal-credit-union` — Truliant Federal Credit Union (3466 NC orig.)
- `coastal-federal-credit-union` — COASTAL Federal Credit Union (3167 NC orig.)
- `fairway-mortgage-augusta-sheppard` — FAIRWAY INDEPENDENT MORTGAGE CORPORATION (2993 NC orig.)
- `newrez` — Newrez LLC (2787 NC orig.)
- `lennar-mortgage-queen-creek` — LENNAR MORTGAGE, LLC (2756 NC orig.)
- `silverton-mortgage-myrtle-beach` — VANDERBILT MORTGAGE AND FINANCE, INC. (2515 NC orig.)
- `guaranteed-rate` — GUARANTEED RATE, INC. (2491 NC orig.)
- `pnc-bank` — PNC Bank, National Association (2361 NC orig.)
- `jpmorgan-chase-bank` — JPMorgan Chase Bank, National Association (2307 NC orig.)
- `wells-fargo-bank` — Wells Fargo Bank, National Association (2302 NC orig.)
- `eagle-home-mortgage` — Eagle Home Mortgage, LLC (2216 NC orig.)
- `union-home-mortgage-reeves-team` — UNION HOME MORTGAGE CORP. (2127 NC orig.)
- `guild-mortgage-charlotte` — GUILD MORTGAGE COMPANY LLC (1957 NC orig.)
- `mr-cooper` — NATIONSTAR MORTGAGE LLC (1949 NC orig.)

## Major markets (panel-ready)

- **Wake** (`37183`) — 32310 originations
- **Mecklenburg** (`37119`) — 29329 originations
- **Guilford** (`37081`) — 11525 originations
- **Forsyth** (`37067`) — 9620 originations
- **Cumberland** (`37051`) — 8370 originations
- **Union** (`37179`) — 8298 originations
- **Brunswick** (`37019`) — 8193 originations
- **Johnston** (`37101`) — 7995 originations
- **Durham** (`37063`) — 7684 originations
- **Cabarrus** (`37025`) — 7194 originations
- **Onslow** (`37133`) — 7087 originations
- **Gaston** (`37071`) — 7009 originations
- **New Hanover** (`37129`) — 6562 originations
- **Iredell** (`37097`) — 6305 originations
- **Buncombe** (`37021`) — 5578 originations
- **Harnett** (`37085`) — 5532 originations
- **Catawba** (`37035`) — 4897 originations
- **Alamance** (`37001`) — 4837 originations
- **Davidson** (`37057`) — 4799 originations
- **Rowan** (`37159`) — 3974 originations
- **Pitt** (`37147`) — 3900 originations
- **Moore** (`37125`) — 3677 originations
- **Randolph** (`37151`) — 3200 originations
- **Henderson** (`37089`) — 3103 originations
- **Craven** (`37049`) — 3084 originations
- **Lincoln** (`37109`) — 2925 originations
- **Orange** (`37135`) — 2897 originations
- **Wayne** (`37191`) — 2636 originations
- **Pender** (`37141`) — 2534 originations
- **Franklin** (`37069`) — 2471 originations
- **Carteret** (`37031`) — 2442 originations
- **Cleveland** (`37045`) — 2373 originations
- **Nash** (`37127`) — 2288 originations
- **Rockingham** (`37157`) — 2272 originations
- **Hoke** (`37093`) — 2212 originations
- **Chatham** (`37037`) — 2161 originations
- **Burke** (`37023`) — 1900 originations
- **Caldwell** (`37027`) — 1896 originations
- **Stanly** (`37167`) — 1878 originations
- **Dare** (`37055`) — 1806 originations

## Matching rules

- Reuse prior product-state curated LEI maps when LEI has NC activity
- **nc_deepen** GLEIF re-identification overrides corrupted early FL-reuse swaps
- Prefer NC directory hosts (Guild/CCM/Movement Charlotte, SECU, Truliant, Coastal FCU)
- Precision over coverage — low-confidence regionals deferred

## Rebuild

```bash
python scripts/build-hmda-north-carolina-deepen.py
```
