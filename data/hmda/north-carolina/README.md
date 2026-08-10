# North Carolina HMDA slice
- County market rows: **30**
- Lender–county activity (major counties): **10217**
- LEI state summaries: **1121**
- High-confidence LEI→directory mappings: **63**
- Major counties with names: **30**

## Top mapped LEIs by NC originations

- `rocket-mortgage` — Rocket Mortgage, LLC (18462 NC orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (13671 NC orig.)
- `cardinal-financial` — Cardinal Financial Company, Limited Partnership (8138 NC orig.)
- `truist-bank` — Truist Bank (7920 NC orig.)
- `crosscountry-mortgage-charlotte` — CrossCountry Mortgage, LLC (5258 NC orig.)
- `navy-federal-jacksonville` — Navy Federal Credit Union (5249 NC orig.)
- `guaranteed-rate` — Guaranteed Rate, Inc. (4880 NC orig.)
- `movement-mortgage-charlotte` — Movement Mortgage, LLC (4769 NC orig.)
- `guild-mortgage-charlotte` — Guild Mortgage Company LLC (4463 NC orig.)
- `freedom-mortgage` — Freedom Mortgage Corporation (4431 NC orig.)
- `pennymac` — PennyMac Loan Services, LLC (3969 NC orig.)
- `fairway-mortgage-augusta-sheppard` — Fairway Independent Mortgage Corporation (3751 NC orig.)
- `primelending-columbus` — PrimeLending, a PlainsCapital Company (2993 NC orig.)
- `newrez` — Newrez LLC (2787 NC orig.)
- `loandepot` — loanDepot.com, LLC (2756 NC orig.)
- `mr-cooper` — Nationstar Mortgage LLC (2491 NC orig.)
- `pnc-bank` — PNC Bank, National Association (2361 NC orig.)
- `jpmorgan-chase-bank` — JPMorgan Chase Bank, National Association (2307 NC orig.)
- `wells-fargo-bank` — Wells Fargo Bank, National Association (2302 NC orig.)
- `eagle-home-mortgage` — Eagle Home Mortgage, LLC (2216 NC orig.)
- `union-home-mortgage-reeves-team` — UNION HOME MORTGAGE CORP. (2127 NC orig.)
- `ally-bank` — Ally Bank (1957 NC orig.)
- `mr-cooper` — NATIONSTAR MORTGAGE LLC (1949 NC orig.)
- `new-american-funding` — Broker Solutions, Inc. (1619 NC orig.)
- `prmg` — Paramount Residential Mortgage Group, Inc. (1555 NC orig.)

## Major counties (panel-ready)

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

## Matching rules

- Reuse FL / TX / GA / CA curated LEI maps when the LEI has NC activity
- National NMLS→slug overrides prefer company-level directory hosts
- No fuzzy LEI inventing

## Rebuild

```bash
python scripts/build-hmda-north-carolina-slice.py
```
