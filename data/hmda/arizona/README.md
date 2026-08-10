# Arizona HMDA slice

**Source:** `data/hmda/by-state/AZ/` (national 2025 foundation)

- County market rows: **15**
- Lender–county activity (major markets): **4179**
- LEI state summaries: **953**
- High-confidence LEI→directory mappings: **123**
- Major markets with names: **15**

## Top mapped LEIs by AZ originations

- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (19328 AZ orig.)
- `rocket-mortgage` — Rocket Mortgage, LLC (13320 AZ orig.)
- `desert-financial-credit-union` — DESERT FINANCIAL CREDIT UNION (10566 AZ orig.)
- `crosscountry-mortgage-west-valley` — CROSSCOUNTRY MORTGAGE, LLC (4945 AZ orig.)
- `fairway-mortgage-augusta-sheppard` — FAIRWAY INDEPENDENT MORTGAGE CORPORATION (4724 AZ orig.)
- `loandepot` — LOANDEPOT.COM, LLC (4138 AZ orig.)
- `guild-mortgage-west-valley` — GUILD MORTGAGE COMPANY LLC (3467 AZ orig.)
- `nova-home-loans-west-valley` — NOVA FINANCIAL & INVESTMENT CORPORATION (3413 AZ orig.)
- `pennymac` — PENNYMAC LOAN SERVICES, LLC (3232 AZ orig.)
- `jpmorgan-chase-bank` — JPMorgan Chase Bank, National Association (2864 AZ orig.)
- `lennar-mortgage-queen-creek` — LENNAR MORTGAGE, LLC (2623 AZ orig.)
- `bank-of-america-mortgage-west-valley` — Bank of America, National Association (2582 AZ orig.)
- `cmg-home-loans-dennis-vo` — CMG Mortgage, Inc. (2579 AZ orig.)
- `dhi-mortgage-buckeye` — DHI MORTGAGE COMPANY, LTD. (2406 AZ orig.)
- `vip-mortgage` — V.I.P. MORTGAGE, INC. (2321 AZ orig.)
- `freedom-mortgage` — FREEDOM MORTGAGE CORPORATION (2123 AZ orig.)
- `oneaz-credit-union-east-valley` — OneAZ Credit Union (1992 AZ orig.)
- `navy-federal-jacksonville` — Navy Federal Credit Union (1960 AZ orig.)
- `newrez` — Newrez LLC (1845 AZ orig.)
- `us-bank` — U.S. Bank National Association (1813 AZ orig.)

## Major markets (panel-ready)

- **Maricopa** (`04013`) — 111789 originations
- **Pima** (`04019`) — 23249 originations
- **Pinal** (`04021`) — 18081 originations
- **Yavapai** (`04025`) — 7253 originations
- **Mohave** (`04015`) — 6605 originations
- **Yuma** (`04027`) — 4606 originations
- **Coconino** (`04005`) — 2905 originations
- **Cochise** (`04003`) — 2817 originations
- **Navajo** (`04017`) — 2176 originations
- **Gila** (`04007`) — 1371 originations
- **Santa Cruz** (`04023`) — 952 originations
- **Graham** (`04009`) — 846 originations
- **Apache** (`04001`) — 459 originations
- **La Paz** (`04012`) — 197 originations
- **Greenlee** (`04011`) — 68 originations

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has AZ activity
- AZ deepen: GLEIF-reidentified high-value LEIs + AZ directory NMLS/slugs (Guild, CCM, DHI, Lennar, BofA, VU/MRC, Freedom, Fairway, PennyMac, loanDepot, Movement, Guaranteed Rate, NAF, Silverton, Sun American, Desert Financial, Nova, OneAZ)
- Precision only — no low-confidence LEI inventing (VIP Mortgage, Arizona Financial CU, Vantage West, Copper State CU, builder captives without directory deferred)

## Rebuild

```bash
python scripts/build-hmda-arizona-slice.py
```

## Major slugs (for states.ts)

```
'maricopa', 'pima', 'pinal', 'yavapai', 'mohave', 'yuma', 'coconino', 'cochise', 'navajo', 'gila', 'santa-cruz', 'graham', 'apache', 'la-paz', 'greenlee'
```
