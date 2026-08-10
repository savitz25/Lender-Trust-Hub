# Maryland HMDA slice

**Source:** `data/hmda/by-state/MD/` (national 2025 foundation)

- County market rows: **24**
- Lender–county activity (major markets): **6061**
- LEI state summaries: **708**
- High-confidence LEI→directory mappings: **105**
- Major markets with names: **22**

## Top mapped LEIs by MD originations

- `rocket-mortgage` — Rocket Mortgage, LLC (9294 MD orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (6306 MD orig.)
- `navy-federal-jacksonville` — Navy Federal Credit Union (5163 MD orig.)
- `first-home-mortgage` — FIRST HOME MORTGAGE CORPORATION (3559 MD orig.)
- `truist-bank` — Truist Bank (3245 MD orig.)
- `mt-bank` — Manufacturers and Traders Trust Company (3115 MD orig.)
- `pnc-bank` — PNC Bank, National Association (2948 MD orig.)
- `fairway-mortgage-augusta-sheppard` — Fairway Independent Mortgage Corporation (2636 MD orig.)
- `guaranteed-rate` — Guaranteed Rate, Inc. (2255 MD orig.)
- `nfm-lending` — NFM, INC. (2255 MD orig.)
- `guild-mortgage-metrowest` — Guild Mortgage Company LLC (2128 MD orig.)
- `nvr-mortgage` — NVR Mortgage Finance, Inc. (1912 MD orig.)
- `freedom-mortgage` — Freedom Mortgage Corporation (1763 MD orig.)
- `newrez` — Newrez LLC (1711 MD orig.)
- `tower-federal-credit-union` — TOWER Federal Credit Union (1696 MD orig.)
- `first-national-bank-of-pennsylvania` — First National Bank of Pennsylvania (1678 MD orig.)
- `townebank` — TowneBank (1552 MD orig.)
- `primary-residential-mortgage` — PRIMARY RESIDENTIAL MORTGAGE, INC. (1466 MD orig.)
- `movement-mortgage-myrtle-beach` — Movement Mortgage, LLC (1405 MD orig.)
- `amerihome-mortgage` — AmeriHome Mortgage Company, LLC (1275 MD orig.)

## Major markets (panel-ready)

- **Prince Georges** (`24033`) — 17064 originations
- **Montgomery** (`24031`) — 16639 originations
- **Baltimore** (`24005`) — 15451 originations
- **Anne Arundel** (`24003`) — 14145 originations
- **Baltimore City** (`24510`) — 10215 originations
- **Frederick** (`24021`) — 7470 originations
- **Howard** (`24027`) — 6671 originations
- **Harford** (`24025`) — 6474 originations
- **Charles** (`24017`) — 5144 originations
- **Carroll** (`24013`) — 4205 originations
- **Washington** (`24043`) — 3278 originations
- **St. Marys** (`24037`) — 2685 originations
- **Calvert** (`24009`) — 2531 originations
- **Cecil** (`24015`) — 2441 originations
- **Worcester** (`24047`) — 2324 originations
- **Wicomico** (`24045`) — 2050 originations
- **Queen Annes** (`24035`) — 1691 originations
- **Allegany** (`24001`) — 1138 originations
- **Talbot** (`24041`) — 907 originations
- **Dorchester** (`24019`) — 779 originations
- **Caroline** (`24011`) — 748 originations
- **Garrett** (`24023`) — 707 originations

## Major slugs (for states.ts)

```
'prince-georges', 'montgomery', 'baltimore', 'anne-arundel', 'baltimore-city', 'frederick', 'howard', 'harford', 'charles', 'carroll', 'washington', 'st-marys', 'calvert', 'cecil', 'worcester', 'wicomico', 'queen-annes', 'allegany', 'talbot', 'dorchester', 'caroline', 'garrett'
```

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has state activity
- VA/MD curated: Alcova, Atlantic Coast Mortgage, Atlantic Union Bank, First Home Mortgage, Tower FCU, TowneBank
- No fuzzy LEI inventing

## Rebuild

```bash
python scripts/build-hmda-va-md-slices.py
```
