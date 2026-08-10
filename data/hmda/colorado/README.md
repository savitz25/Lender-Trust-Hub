# Colorado HMDA slice

**Source:** `data/hmda/by-state/CO/` (national 2025 foundation)

- County market rows: **30**
- Lender–county activity (major markets): **7721**
- LEI state summaries: **977**
- High-confidence LEI→directory mappings: **145**
- Major markets with names: **30**

## Top mapped LEIs by CO originations

- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (18178 CO orig.)
- `wings-credit-union` — WINGS CREDIT UNION (8715 CO orig.)
- `rocket-mortgage` — Rocket Mortgage, LLC (8433 CO orig.)
- `ally-bank` — Ally Bank (4338 CO orig.)
- `firstbank-colorado` — FirstBank (3041 CO orig.)
- `elevations-credit-union` — ELEVATIONS (2960 CO orig.)
- `canvas-credit-union` — CANVAS CREDIT UNION (2939 CO orig.)
- `bellco-credit-union` — BELLCO (2818 CO orig.)
- `freedom-mortgage` — Freedom Mortgage Corporation (2472 CO orig.)
- `fairway-mortgage-augusta-sheppard` — Fairway Independent Mortgage Corporation (2360 CO orig.)
- `primelending-columbus` — PrimeLending, a PlainsCapital Company (2297 CO orig.)
- `us-bank` — U.S. Bank National Association (2277 CO orig.)
- `mr-cooper` — Nationstar Mortgage LLC (2143 CO orig.)
- `amerihome-mortgage` — AmeriHome Mortgage Company, LLC (1930 CO orig.)
- `jpmorgan-chase-bank` — JPMorgan Chase Bank, National Association (1880 CO orig.)
- `pennymac` — PennyMac Loan Services, LLC (1864 CO orig.)
- `cmg-home-loans-dennis-vo` — CMG Mortgage, Inc. (1646 CO orig.)
- `guild-mortgage-metrowest` — Guild Mortgage Company LLC (1594 CO orig.)
- `newrez` — Newrez LLC (1561 CO orig.)
- `new-american-funding` — Broker Solutions, Inc. (1551 CO orig.)

## Major markets (panel-ready)

- **El Paso** (`08041`) — 22427 originations
- **Jefferson** (`08059`) — 15679 originations
- **Arapahoe** (`08005`) — 15677 originations
- **Denver** (`08031`) — 14511 originations
- **Adams** (`08001`) — 13838 originations
- **Douglas** (`08035`) — 13022 originations
- **Weld** (`08123`) — 11306 originations
- **Larimer** (`08069`) — 9678 originations
- **Boulder** (`08013`) — 6821 originations
- **Mesa** (`08077`) — 4987 originations
- **Pueblo** (`08101`) — 4403 originations
- **Broomfield** (`08014`) — 1743 originations
- **Garfield** (`08045`) — 1666 originations
- **Eagle** (`08037`) — 1506 originations
- **Summit** (`08117`) — 1471 originations
- **La Plata** (`08067`) — 1420 originations
- **Elbert** (`08039`) — 1345 originations
- **Fremont** (`08043`) — 1227 originations
- **Teller** (`08119`) — 1103 originations
- **Montrose** (`08085`) — 1076 originations
- **Grand** (`08049`) — 967 originations
- **Park** (`08093`) — 931 originations
- **Delta** (`08029`) — 838 originations
- **Routt** (`08107`) — 778 originations
- **Chaffee** (`08015`) — 704 originations
- **Morgan** (`08087`) — 606 originations
- **Archuleta** (`08007`) — 513 originations
- **Gunnison** (`08051`) — 477 originations
- **Pitkin** (`08097`) — 474 originations
- **Montezuma** (`08083`) — 471 originations

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has CO activity
- CO curated + deepen: Wings, FirstBank (CO), Elevations, Canvas, Bellco, VIP, HomeAmerican, American Financing, Alpine, Zions, Westerra, Benchmark, Loan Simple, Security Service FCU, BOK Financial, Climb CU, Bank of Colorado, Credit Union of Colorado
- FirstBank (CO), Bellco, Bank of Colorado, CU of Colorado use LEI identity where needed
- No fuzzy LEI inventing

## Rebuild

```bash
python scripts/build-hmda-co-slices.py
```

## Major slugs (for states.ts)

```
'el-paso', 'jefferson', 'arapahoe', 'denver', 'adams', 'douglas', 'weld', 'larimer', 'boulder', 'mesa', 'pueblo', 'broomfield', 'garfield', 'eagle', 'summit', 'la-plata', 'elbert', 'fremont', 'teller', 'montrose', 'grand', 'park', 'delta', 'routt', 'chaffee', 'morgan', 'archuleta', 'gunnison', 'pitkin', 'montezuma'
```
