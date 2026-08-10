# Arizona HMDA slice

**Source:** `data/hmda/by-state/AZ/` (national 2025 foundation)

- County market rows: **15**
- Lender–county activity (major markets): **3961**
- LEI state summaries: **953**
- High-confidence LEI→directory mappings: **118**
- Major markets with names: **12**

## Top mapped LEIs by AZ originations

- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (19328 AZ orig.)
- `rocket-mortgage` — Rocket Mortgage, LLC (13320 AZ orig.)
- `desert-financial-credit-union` — DESERT FINANCIAL CREDIT UNION (10566 AZ orig.)
- `freedom-mortgage` — Freedom Mortgage Corporation (4945 AZ orig.)
- `primelending-columbus` — PrimeLending, a PlainsCapital Company (4724 AZ orig.)
- `pennymac` — PennyMac Loan Services, LLC (4138 AZ orig.)
- `ally-bank` — Ally Bank (3467 AZ orig.)
- `nova-home-loans-west-valley` — NOVA FINANCIAL & INVESTMENT CORPORATION (3413 AZ orig.)
- `fairway-mortgage-augusta-sheppard` — Fairway Independent Mortgage Corporation (3232 AZ orig.)
- `jpmorgan-chase-bank` — JPMorgan Chase Bank, National Association (2864 AZ orig.)
- `loandepot` — loanDepot.com, LLC (2623 AZ orig.)
- `guaranteed-rate` — Guaranteed Rate, Inc. (2582 AZ orig.)
- `cmg-home-loans-dennis-vo` — CMG Mortgage, Inc. (2579 AZ orig.)
- `crosscountry-mortgage-metrowest` — CrossCountry Mortgage, LLC (2406 AZ orig.)
- `guild-mortgage-west-valley` — Guild Mortgage Company LLC (2123 AZ orig.)
- `oneaz-credit-union-east-valley` — OneAZ Credit Union (1992 AZ orig.)
- `navy-federal-jacksonville` — Navy Federal Credit Union (1960 AZ orig.)
- `newrez` — Newrez LLC (1845 AZ orig.)
- `us-bank` — U.S. Bank National Association (1813 AZ orig.)
- `amerihome-mortgage` — AmeriHome Mortgage Company, LLC (1792 AZ orig.)

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

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has AZ activity
- AZ curated: Desert Financial CU, Nova Home Loans, OneAZ CU, Guild West Valley
- Precision only — no low-confidence LEI inventing (VIP, Vantage West, etc. deferred)

## Rebuild

```bash
python scripts/build-hmda-arizona-slice.py
```

## Major slugs (for states.ts)

```
'maricopa', 'pima', 'pinal', 'yavapai', 'mohave', 'yuma', 'coconino', 'cochise', 'navajo', 'gila', 'santa-cruz', 'graham'
```
