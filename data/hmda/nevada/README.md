# Nevada HMDA slice (deepened)

**Source:** `data/hmda/by-state/NV/` (national foundation)

**Phase:** nevada-deepen

- County market rows: **15**
- Lender–county activity (major markets): **1985**
- LEI state summaries: **536**
- High-confidence LEI→directory mappings: **144**
- Major markets with names: **15**
- Top-20 mapped: **20/20** · Top-50 mapped: **43/50**

## Top mapped LEIs by NV originations

- `rocket-mortgage` — Rocket Mortgage, LLC (5226 NV orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (5215 NV orig.)
- `guild-mortgage-metrowest` — GUILD MORTGAGE COMPANY LLC (3882 NV orig.)
- `america-first-federal-credit-union` — AMERICA FIRST Federal Credit Union (2393 NV orig.)
- `dhi-mortgage-buckeye` — DHI MORTGAGE COMPANY, LTD. (2059 NV orig.)
- `pennymac` — PENNYMAC LOAN SERVICES, LLC (1834 NV orig.)
- `lennar-mortgage-queen-creek` — LENNAR MORTGAGE, LLC (1669 NV orig.)
- `us-bank` — U.S. Bank National Association (1593 NV orig.)
- `loandepot` — LOANDEPOT.COM, LLC (1512 NV orig.)
- `crosscountry-mortgage-metrowest` — CROSSCOUNTRY MORTGAGE, LLC (1424 NV orig.)
- `bank-of-america-mortgage-west-valley` — Bank of America, National Association (1233 NV orig.)
- `new-american-funding` — NEW AMERICAN FUNDING, LLC (1190 NV orig.)
- `navy-federal-jacksonville` — Navy Federal Credit Union (1122 NV orig.)
- `freedom-mortgage` — FREEDOM MORTGAGE CORPORATION (1108 NV orig.)
- `zions-bank` — Zions Bancorporation, N.A. (1054 NV orig.)
- `guaranteed-rate` — GUARANTEED RATE, INC. (986 NV orig.)
- `amerihome-mortgage` — AmeriHome Mortgage Company, LLC (932 NV orig.)
- `kbhs-home-loans` — KBHS HOME LOANS, LLC (905 NV orig.)
- `veterans-united-west-valley` — MORTGAGE RESEARCH CENTER, LLC (900 NV orig.)
- `jpmorgan-chase-bank` — JPMorgan Chase Bank, National Association (865 NV orig.)
- `cmg-home-loans-dennis-vo` — CMG Mortgage, Inc. (836 NV orig.)
- `prmg` — Paramount Residential Mortgage Group, Inc. (748 NV orig.)
- `mr-cooper` — NATIONSTAR MORTGAGE LLC (661 NV orig.)
- `greater-nevada-credit-union` — GREATER NEVADA LLC (634 NV orig.)
- `movement-mortgage-myrtle-beach` — MOVEMENT MORTGAGE, LLC (619 NV orig.)
- `newrez` — Newrez LLC (593 NV orig.)
- `silver-state-schools-credit-union` — SILVER STATE SCHOOLS SERVICE COMPANY, LLC (574 NV orig.)
- `mutual-of-omaha-mortgage` — MUTUAL OF OMAHA MORTGAGE, INC. (509 NV orig.)
- `wells-fargo-bank` — Wells Fargo Bank, National Association (486 NV orig.)
- `better-mortgage` — Better Mortgage Corporation (480 NV orig.)

## Major markets (panel-ready)

- **Clark** (`32003`) — 49879 originations
- **Washoe** (`32031`) — 10588 originations
- **Lyon** (`32019`) — 2006 originations
- **Nye** (`32023`) — 1408 originations
- **Douglas** (`32005`) — 1353 originations
- **Elko** (`32007`) — 1124 originations
- **Carson City** (`32510`) — 1108 originations
- **Churchill** (`32001`) — 565 originations
- **Humboldt** (`32013`) — 419 originations
- **White Pine** (`32033`) — 195 originations
- **Storey** (`32029`) — 125 originations
- **Lander** (`32015`) — 102 originations
- **Lincoln** (`32017`) — 87 originations
- **Pershing** (`32027`) — 85 originations
- **Mineral** (`32021`) — 63 originations

## Matching rules

- Reuse prior product-state curated LEI maps when LEI has NV activity
- **nv_deepen** GLEIF re-identification + NV directory hosts
- Precision over coverage — low-confidence regionals deferred

## Rebuild

```bash
python scripts/build-hmda-nevada-deepen.py
```
