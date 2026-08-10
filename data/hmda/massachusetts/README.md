# Massachusetts HMDA slice

**Source:** `data/hmda/by-state/MA/` (national 2025 foundation)

- County market rows: **14**
- Lender–county activity (major counties): **4151**
- LEI state summaries: **709**
- High-confidence LEI→directory mappings: **84**
- Major counties with names: **12**

## Top mapped LEIs by MA originations

- `citizens-bank` — Citizens Bank, National Association (10235 MA orig.)
- `rocket-mortgage` — Rocket Mortgage, LLC (6590 MA orig.)
- `leader-bank` — Leader Bank, National Association (4926 MA orig.)
- `mr-cooper` — Nationstar Mortgage LLC (4507 MA orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (4404 MA orig.)
- `freedom-mortgage` — Freedom Mortgage Corporation (3923 MA orig.)
- `eastern-bank` — Eastern Bank (3620 MA orig.)
- `guaranteed-rate` — Guaranteed Rate, Inc. (3551 MA orig.)
- `rockland-trust` — Rockland Trust Company (3239 MA orig.)
- `amerihome-mortgage` — AmeriHome Mortgage Company, LLC (2329 MA orig.)
- `ally-bank` — Ally Bank (2282 MA orig.)
- `td-bank` — TD Bank, National Association (1975 MA orig.)
- `primelending-columbus` — PrimeLending, a PlainsCapital Company (1954 MA orig.)
- `pennymac` — PennyMac Loan Services, LLC (1900 MA orig.)
- `mt-bank` — Manufacturers and Traders Trust Company (1690 MA orig.)
- `cardinal-financial` — Cardinal Financial Company, Limited Partnership (1412 MA orig.)
- `total-mortgage-services` — TOTAL MORTGAGE SERVICES, LLC (1361 MA orig.)
- `fairway-mortgage-augusta-sheppard` — Fairway Independent Mortgage Corporation (1315 MA orig.)
- `jpmorgan-chase-bank` — JPMorgan Chase Bank, National Association (1248 MA orig.)
- `salem-five-mortgage` — SALEM FIVE MORTGAGE COMPANY, LLC (1194 MA orig.)
- `newrez` — Newrez LLC (1151 MA orig.)
- `new-american-funding` — Broker Solutions, Inc. (1118 MA orig.)
- `mr-cooper` — NATIONSTAR MORTGAGE LLC (932 MA orig.)
- `us-bank` — U.S. Bank National Association (876 MA orig.)
- `guaranteed-rate-affinity` — GUARANTEED RATE AFFINITY, LLC (816 MA orig.)

## Major counties (panel-ready)

- **Middlesex** (`25017`) — 29145 originations
- **Worcester** (`25027`) — 18621 originations
- **Essex** (`25009`) — 15571 originations
- **Norfolk** (`25021`) — 14224 originations
- **Plymouth** (`25023`) — 12861 originations
- **Bristol** (`25005`) — 11411 originations
- **Suffolk** (`25025`) — 9625 originations
- **Hampden** (`25013`) — 9025 originations
- **Barnstable** (`25001`) — 7248 originations
- **Berkshire** (`25003`) — 2729 originations
- **Hampshire** (`25015`) — 2628 originations
- **Franklin** (`25011`) — 1260 originations

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has MA activity
- National NMLS→slug overrides prefer MA directory hosts when known
- MA curated: Leader Bank, Eastern Bank, Rockland Trust, Salem Five Mortgage, Total Mortgage Services (GLEIF + published company NMLS)
- No fuzzy LEI inventing

## Rebuild

```bash
python scripts/process_hmda_national.py year_2025.csv  # if partition missing
python scripts/build-hmda-massachusetts-slice.py
```
