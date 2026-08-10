# New Hampshire HMDA slice

**Source:** `data/hmda/by-state/NH/` (national 2025 foundation)

- County market rows: **10**
- Lender–county activity (major counties): **2229**
- LEI state summaries: **475**
- High-confidence LEI→directory mappings: **98**
- Major counties with names: **10**

## Top mapped LEIs by NH originations

- `citizens-bank` — Citizens Bank, National Association (3194 NH orig.)
- `amerihome-mortgage` — AmeriHome Mortgage Company, LLC (2466 NH orig.)
- `rocket-mortgage` — Rocket Mortgage, LLC (2297 NH orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (1967 NH orig.)
- `service-credit-union` — Service Federal Credit Union (1321 NH orig.)
- `td-bank` — TD Bank, National Association (997 NH orig.)
- `st-marys-bank` — ST. MARY'S BANK (967 NH orig.)
- `emm-loans` — EMM LOANS LLC (806 NH orig.)
- `primelending-columbus` — PrimeLending, a PlainsCapital Company (707 NH orig.)
- `ally-bank` — Ally Bank (688 NH orig.)
- `freedom-mortgage` — Freedom Mortgage Corporation (678 NH orig.)
- `pennymac` — PennyMac Loan Services, LLC (635 NH orig.)
- `guaranteed-rate` — Guaranteed Rate, Inc. (483 NH orig.)
- `mr-cooper` — Nationstar Mortgage LLC (418 NH orig.)
- `movement-mortgage-myrtle-beach` — Movement Mortgage, LLC (380 NH orig.)
- `fairway-mortgage-augusta-sheppard` — Fairway Independent Mortgage Corporation (370 NH orig.)
- `camden-national-bank` — The Camden National Bank (344 NH orig.)
- `navy-federal-jacksonville` — Navy Federal Credit Union (342 NH orig.)
- `mt-bank` — Manufacturers and Traders Trust Company (331 NH orig.)
- `cardinal-financial` — Cardinal Financial Company, Limited Partnership (330 NH orig.)

## Major counties / regions (panel-ready)

- **Hillsborough** (`33011`) — 10413 originations
- **Rockingham** (`33015`) — 8943 originations
- **Merrimack** (`33013`) — 3862 originations
- **Strafford** (`33017`) — 3261 originations
- **Grafton** (`33009`) — 1984 originations
- **Belknap** (`33001`) — 1966 originations
- **Carroll** (`33003`) — 1914 originations
- **Cheshire** (`33005`) — 1607 originations
- **Sullivan** (`33019`) — 939 originations
- **Coos** (`33007`) — 687 originations

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has state activity
- CT/NH curated: Liberty Bank, First World Mortgage, Service Credit Union, St. Mary's Bank
- No fuzzy LEI inventing

## Rebuild

```bash
python scripts/build-hmda-ct-nh-slices.py
```
