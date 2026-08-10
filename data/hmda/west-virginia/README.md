# West Virginia HMDA slice

**Source:** `data/hmda/by-state/WV/` (national 2025 foundation)

- County market rows: **21**
- Lender–county activity (major markets): **2081**
- LEI state summaries: **470**
- High-confidence LEI→directory mappings: **141**
- Major markets with names: **18**

## Top mapped LEIs by WV originations

- `rocket-mortgage` — Rocket Mortgage, LLC (2472 WV orig.)
- `city-national-bank-of-west-virginia` — City National Bank of West Virginia (1808 WV orig.)
- `huntington-national-bank` — The Huntington National Bank (1148 WV orig.)
- `loandepot` — LOANDEPOT.COM, LLC (1044 WV orig.)
- `wesbanco-bank` — WesBanco Bank, Inc. (956 WV orig.)
- `truist-bank` — Truist Bank (919 WV orig.)
- `movement-mortgage-myrtle-beach` — MOVEMENT MORTGAGE, LLC (785 WV orig.)
- `veterans-united-west-valley` — MORTGAGE RESEARCH CENTER, LLC (771 WV orig.)
- `crosscountry-mortgage-metrowest` — CROSSCOUNTRY MORTGAGE, LLC (723 WV orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (675 WV orig.)
- `navy-federal-jacksonville` — Navy Federal Credit Union (500 WV orig.)
- `peoples-bank-west-virginia` — Peoples Bank (446 WV orig.)
- `silverton-mortgage-myrtle-beach` — VANDERBILT MORTGAGE AND FINANCE, INC. (407 WV orig.)
- `lennar-mortgage-queen-creek` — LENNAR MORTGAGE, LLC (402 WV orig.)
- `primelending-columbus` — PRIMELENDING, A PLAINSCAPITAL COMPANY (380 WV orig.)
- `pennymac` — PENNYMAC LOAN SERVICES, LLC (368 WV orig.)
- `clear-mountain-bank` — Clear Mountain Bank (364 WV orig.)
- `gateway-mortgage-myrtle-beach` — Gateway First Bank (337 WV orig.)
- `united-bank` — United Bank (332 WV orig.)
- `freedom-mortgage` — FREEDOM MORTGAGE CORPORATION (293 WV orig.)

## Major markets (panel-ready)

- **Berkeley** (`54003`) — 4391 originations
- **Kanawha** (`54039`) — 2728 originations
- **Jefferson** (`54037`) — 2548 originations
- **Monongalia** (`54061`) — 1731 originations
- **Cabell** (`54011`) — 1452 originations
- **Wood** (`54107`) — 1287 originations
- **Raleigh** (`54081`) — 1251 originations
- **Putnam** (`54079`) — 1180 originations
- **Harrison** (`54033`) — 1024 originations
- **Marion** (`54049`) — 909 originations
- **Mercer** (`54055`) — 684 originations
- **Ohio** (`54069`) — 590 originations
- **Hampshire** (`54027`) — 540 originations
- **Greenbrier** (`54025`) — 534 originations
- **Morgan** (`54065`) — 521 originations
- **Fayette** (`54019`) — 502 originations
- **Wayne** (`54099`) — 485 originations
- **Hancock** (`54029`) — 458 originations

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has activity in this state
- NM curated: Waterstone Mortgage, Nusenda, Sunward FCU, U.S. Eagle FCU, Kirtland FCU, Sandia Area FCU, Citizens Bank of Las Cruces
- WV curated: City National Bank of WV, Peoples Bank, Clear Mountain Bank (+ Huntington / WesBanco / United Bank / Truist reuse)
- Doña Ana → directory slug `dona-ana` (ASCII-safe)
- Precision over coverage — no fuzzy LEI inventing

## Rebuild

```bash
python scripts/build-hmda-nm-wv-slices.py
```

## Major slugs (for states.ts)

```
'berkeley', 'kanawha', 'jefferson', 'monongalia', 'cabell', 'wood', 'raleigh', 'putnam', 'harrison', 'marion', 'mercer', 'ohio', 'hampshire', 'greenbrier', 'morgan', 'fayette', 'wayne', 'hancock'
```
