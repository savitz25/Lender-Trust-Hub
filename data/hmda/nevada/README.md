# Nevada HMDA slice

**Source:** `data/hmda/by-state/NV/` (national 2025 foundation)

- County market rows: **17**
- Lender–county activity (major markets): **1757**
- LEI state summaries: **536**
- High-confidence LEI→directory mappings: **116**
- Major markets with names: **9**

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
- `guaranteed-rate` — Guaranteed Rate, Inc. (1233 NV orig.)
- `new-american-funding` — NEW AMERICAN FUNDING, LLC (1190 NV orig.)
- `navy-federal-jacksonville` — Navy Federal Credit Union (1122 NV orig.)
- `freedom-mortgage` — FREEDOM MORTGAGE CORPORATION (1108 NV orig.)
- `zions-bank` — Zions Bancorporation, N.A. (1054 NV orig.)
- `guaranteed-rate` — GUARANTEED RATE, INC. (986 NV orig.)
- `amerihome-mortgage` — AmeriHome Mortgage Company, LLC (932 NV orig.)
- `veterans-united-west-valley` — MORTGAGE RESEARCH CENTER, LLC (900 NV orig.)
- `jpmorgan-chase-bank` — JPMorgan Chase Bank, National Association (865 NV orig.)
- `cmg-home-loans-dennis-vo` — CMG Mortgage, Inc. (836 NV orig.)
- `prmg` — Paramount Residential Mortgage Group, Inc. (748 NV orig.)
- `mr-cooper` — NATIONSTAR MORTGAGE LLC (661 NV orig.)
- `greater-nevada-credit-union` — GREATER NEVADA LLC (634 NV orig.)
- `movement-mortgage-myrtle-beach` — MOVEMENT MORTGAGE, LLC (619 NV orig.)
- `newrez` — Newrez LLC (593 NV orig.)

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

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has activity in this state
- UT/NV curated: America First FCU, Mountain America FCU, Intercap, Goldenwest, First Colony, SecurityNational, Utah Community CU, RanLife, Bank of Utah, Deseret First, Utah First, Chartway, Security Home Mortgage, Provident Funding, Greater Nevada CU, plus Academy / PRMI / Zions directory reuse
- Precision over coverage — no fuzzy LEI inventing

## Rebuild

```bash
python scripts/build-hmda-ut-nv-slices.py
```

## Major slugs (for states.ts)

```
'clark', 'washoe', 'lyon', 'nye', 'douglas', 'elko', 'carson-city', 'churchill', 'humboldt'
```
