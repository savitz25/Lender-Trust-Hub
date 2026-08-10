# North Dakota HMDA slice

**Source:** `data/hmda/by-state/ND/` (national 2025 foundation)

- Market rows: **18**
- Lender–market activity (major markets): **1169**
- LEI state summaries: **277**
- High-confidence LEI→directory mappings: **103**
- Major markets with names: **16**

## Top mapped LEIs by ND originations

- `gate-city-bank` — GATE CITY BANK (2368 ND orig.)
- `first-international-bank-and-trust` — First International Bank & Trust (941 ND orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (725 ND orig.)
- `bell-bank` — Bell Bank (674 ND orig.)
- `rocket-mortgage` — Rocket Mortgage, LLC (549 ND orig.)
- `first-community-credit-union-nd` — FIRST COMMUNITY CREDIT UNION (518 ND orig.)
- `fairway-mortgage-augusta-sheppard` — FAIRWAY INDEPENDENT MORTGAGE CORPORATION (382 ND orig.)
- `bravera-bank` — Bravera Bank (326 ND orig.)
- `veterans-united-west-valley` — MORTGAGE RESEARCH CENTER, LLC (276 ND orig.)
- `us-bank` — U.S. Bank National Association (239 ND orig.)
- `alerus-financial` — Alerus Financial, National Association (235 ND orig.)
- `benchmark-mortgage` — ARK-LA-TEX FINANCIAL SERVICES, LLC. (176 ND orig.)
- `old-national-bank` — Old National Bank (135 ND orig.)
- `loandepot` — LOANDEPOT.COM, LLC (121 ND orig.)
- `guild-mortgage-metrowest` — GUILD MORTGAGE COMPANY LLC (112 ND orig.)
- `pennymac` — PENNYMAC LOAN SERVICES, LLC (110 ND orig.)
- `newrez` — Newrez LLC (109 ND orig.)
- `dacotah-bank` — Dacotah Bank (109 ND orig.)
- `21st-mortgage` — 21ST MORTGAGE CORPORATION (108 ND orig.)
- `crosscountry-mortgage-metrowest` — CROSSCOUNTRY MORTGAGE, LLC (104 ND orig.)

## Major markets (panel-ready)

- **Cass** (`38017`) — 4100 originations
- **Burleigh** (`38015`) — 2202 originations
- **Ward** (`38101`) — 1378 originations
- **Grand Forks** (`38035`) — 1263 originations
- **Morton** (`38059`) — 757 originations
- **Stark** (`38089`) — 721 originations
- **Williams** (`38105`) — 712 originations
- **Stutsman** (`38093`) — 386 originations
- **Richland** (`38077`) — 313 originations
- **McKenzie** (`38053`) — 226 originations
- **McLean** (`38055`) — 168 originations
- **Barnes** (`38003`) — 162 originations
- **Ramsey** (`38071`) — 158 originations
- **Traill** (`38097`) — 155 originations
- **Mercer** (`38057`) — 148 originations
- **Mountrail** (`38061`) — 95 originations

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
'cass', 'burleigh', 'ward', 'grand-forks', 'morton', 'stark', 'williams', 'stutsman', 'richland', 'mckenzie', 'mclean', 'barnes', 'ramsey', 'traill', 'mercer', 'mountrail'
```
