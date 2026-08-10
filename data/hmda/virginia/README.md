# Virginia HMDA slice

**Source:** `data/hmda/by-state/VA/` (national 2025 foundation)

- County market rows: **113**
- Lender–county activity (major markets): **8513**
- LEI state summaries: **885**
- High-confidence LEI→directory mappings: **107**
- Major markets with names: **32**

## Top mapped LEIs by VA originations

- `rocket-mortgage` — Rocket Mortgage, LLC (14489 VA orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (10136 VA orig.)
- `navy-federal-jacksonville` — Navy Federal Credit Union (9684 VA orig.)
- `truist-bank` — Truist Bank (6374 VA orig.)
- `movement-mortgage-myrtle-beach` — Movement Mortgage, LLC (4500 VA orig.)
- `cardinal-financial` — Cardinal Financial Company, Limited Partnership (4339 VA orig.)
- `fairway-mortgage-augusta-sheppard` — Fairway Independent Mortgage Corporation (4338 VA orig.)
- `atlantic-bay-mortgage-charleston` — ATLANTIC BAY MORTGAGE GROUP, L.L.C. (4244 VA orig.)
- `guild-mortgage-metrowest` — Guild Mortgage Company LLC (3646 VA orig.)
- `atlantic-coast-mortgage` — Atlantic Coast Mortgage, LLC (3458 VA orig.)
- `atlantic-union-bank` — Atlantic Union Bank (3237 VA orig.)
- `freedom-mortgage` — Freedom Mortgage Corporation (2938 VA orig.)
- `nvr-mortgage` — NVR Mortgage Finance, Inc. (2711 VA orig.)
- `guaranteed-rate` — Guaranteed Rate, Inc. (2688 VA orig.)
- `alcova-mortgage` — Alcova Mortgage LLC (2663 VA orig.)
- `first-heritage-mortgage` — First Heritage Mortgage, LLC (2637 VA orig.)
- `anniemac-home-mortgage` — AMERICAN NEIGHBORHOOD MORTGAGE ACCEPTANCE COMPANY LLC (2520 VA orig.)
- `amerihome-mortgage` — AmeriHome Mortgage Company, LLC (2325 VA orig.)
- `pennymac` — PennyMac Loan Services, LLC (2215 VA orig.)
- `newrez` — Newrez LLC (2175 VA orig.)

## Major markets (panel-ready)

- **Fairfax** (`51059`) — 20774 originations
- **Virginia Beach** (`51810`) — 11925 originations
- **Loudoun** (`51107`) — 11500 originations
- **Chesterfield** (`51041`) — 10860 originations
- **Prince William** (`51153`) — 10738 originations
- **Henrico** (`51087`) — 8202 originations
- **Chesapeake** (`51550`) — 7635 originations
- **Norfolk** (`51710`) — 5291 originations
- **Spotsylvania** (`51177`) — 4656 originations
- **Stafford** (`51179`) — 4608 originations
- **Richmond** (`51760`) — 4259 originations
- **Newport News** (`51700`) — 3898 originations
- **Hampton** (`51650`) — 3799 originations
- **Suffolk** (`51800`) — 3537 originations
- **Arlington** (`51013`) — 3201 originations
- **Hanover** (`51085`) — 3120 originations
- **Portsmouth** (`51740`) — 3009 originations
- **Frederick** (`51069`) — 2992 originations
- **Alexandria** (`51510`) — 2841 originations
- **Roanoke** (`51161`) — 2547 originations
- **Albemarle** (`51003`) — 2373 originations
- **James City** (`51095`) — 2304 originations
- **Roanoke City** (`51770`) — 2275 originations
- **Bedford** (`51019`) — 2146 originations
- **Augusta** (`51015`) — 2101 originations
- **Fauquier** (`51061`) — 2009 originations
- **Rockingham** (`51165`) — 1868 originations
- **York** (`51199`) — 1849 originations
- **Montgomery** (`51121`) — 1576 originations
- **Lynchburg** (`51680`) — 1569 originations
- **Louisa** (`51109`) — 1534 originations
- **Isle of Wight** (`51093`) — 1384 originations

## Major slugs (for states.ts)

```
'fairfax', 'virginia-beach', 'loudoun', 'chesterfield', 'prince-william', 'henrico', 'chesapeake', 'norfolk', 'spotsylvania', 'stafford', 'richmond', 'newport-news', 'hampton', 'suffolk', 'arlington', 'hanover', 'portsmouth', 'frederick', 'alexandria', 'roanoke', 'albemarle', 'james-city', 'roanoke-city', 'bedford', 'augusta', 'fauquier', 'rockingham', 'york', 'montgomery', 'lynchburg', 'louisa', 'isle-of-wight'
```

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has state activity
- VA/MD curated: Alcova, Atlantic Coast Mortgage, Atlantic Union Bank, First Home Mortgage, Tower FCU, TowneBank
- No fuzzy LEI inventing

## Rebuild

```bash
python scripts/build-hmda-va-md-slices.py
```
