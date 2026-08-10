# Colorado HMDA slice

**Source:** `data/hmda/by-state/CO/` (national 2025 foundation)

- County market rows: **24**
- Lender–county activity (major markets): **6266**
- LEI state summaries: **977**
- High-confidence LEI→directory mappings: **136**
- Major markets with names: **20**

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

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has CO activity
- CO curated: Wings CU, FirstBank (CO), Elevations CU, Canvas CU, Bellco CU, V.I.P. Mortgage, HomeAmerican Mortgage, American Financing, Alpine Bank
- FirstBank (CO) and Bellco use LEI identity to avoid cross-state NMLS collisions
- No fuzzy LEI inventing

## Rebuild

```bash
python scripts/build-hmda-co-slices.py
```

## Major slugs (for states.ts)

```
'el-paso', 'jefferson', 'arapahoe', 'denver', 'adams', 'douglas', 'weld', 'larimer', 'boulder', 'mesa', 'pueblo', 'broomfield', 'garfield', 'eagle', 'summit', 'la-plata', 'elbert', 'fremont', 'teller', 'montrose'
```
