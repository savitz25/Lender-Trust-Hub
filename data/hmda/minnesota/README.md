# Minnesota HMDA slice

**Source:** `data/hmda/by-state/MN/` (national 2025 foundation)

- County market rows: **36**
- Lender–county activity (major markets): **7163**
- LEI state summaries: **772**
- High-confidence LEI→directory mappings: **126**
- Major markets with names: **36**

## Top mapped LEIs by MN originations

- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (6703 MN orig.)
- `bell-bank` — Bell Bank (6525 MN orig.)
- `rocket-mortgage` — Rocket Mortgage, LLC (5672 MN orig.)
- `us-bank` — U.S. Bank National Association (4538 MN orig.)
- `trustone-financial-credit-union` — TRUSTONE FINANCIAL CREDIT UNION (4135 MN orig.)
- `affinity-plus-federal-credit-union` — AFFINITY PLUS (3656 MN orig.)
- `crosscountry-mortgage-metrowest` — CROSSCOUNTRY MORTGAGE, LLC (3129 MN orig.)
- `blaze-credit-union` — BLAZE CREDIT UNION (2694 MN orig.)
- `fairway-mortgage-augusta-sheppard` — FAIRWAY INDEPENDENT MORTGAGE CORPORATION (2657 MN orig.)
- `wings-financial-credit-union` — Wings Financial Credit Union (2594 MN orig.)
- `old-national-bank` — Old National Bank (1877 MN orig.)
- `new-american-funding` — Broker Solutions, Inc. (1842 MN orig.)
- `royal-credit-union` — Royal Credit Union (1772 MN orig.)
- `prosperity-home-mortgage` — Prosperity Home Mortgage, LLC (1746 MN orig.)
- `huntington-national-bank` — The Huntington National Bank (1707 MN orig.)
- `pennymac` — PENNYMAC LOAN SERVICES, LLC (1705 MN orig.)
- `guaranteed-rate` — GUARANTEED RATE, INC. (1552 MN orig.)
- `alerus-financial` — Alerus Financial, National Association (1505 MN orig.)
- `wells-fargo-bank` — Wells Fargo Bank, National Association (1496 MN orig.)
- `loandepot` — LOANDEPOT.COM, LLC (1400 MN orig.)

## Major markets (panel-ready)

- **Hennepin** (`27053`) — 25783 originations
- **Dakota** (`27037`) — 10299 originations
- **Ramsey** (`27123`) — 9342 originations
- **Anoka** (`27003`) — 8713 originations
- **Washington** (`27163`) — 7386 originations
- **Wright** (`27171`) — 4545 originations
- **St. Louis** (`27137`) — 4132 originations
- **Scott** (`27139`) — 3863 originations
- **Olmsted** (`27109`) — 3562 originations
- **Stearns** (`27145`) — 3149 originations
- **Carver** (`27019`) — 3090 originations
- **Sherburne** (`27141`) — 2780 originations
- **Crow Wing** (`27035`) — 1786 originations
- **Chisago** (`27025`) — 1567 originations
- **Clay** (`27027`) — 1552 originations
- **Rice** (`27131`) — 1295 originations
- **Otter Tail** (`27111`) — 1242 originations
- **Isanti** (`27059`) — 1189 originations
- **Blue Earth** (`27013`) — 1087 originations
- **Winona** (`27169`) — 1050 originations
- **Goodhue** (`27049`) — 998 originations
- **Itasca** (`27061`) — 998 originations
- **Carlton** (`27017`) — 912 originations
- **Benton** (`27009`) — 863 originations
- **Mille Lacs** (`27095`) — 810 originations
- **Douglas** (`27041`) — 798 originations
- **McLeod** (`27085`) — 788 originations
- **Cass** (`27021`) — 783 originations
- **Becker** (`27005`) — 766 originations
- **Mower** (`27099`) — 752 originations
- **Pine** (`27115`) — 748 originations
- **Kandiyohi** (`27067`) — 711 originations
- **Steele** (`27147`) — 677 originations
- **Le Sueur** (`27079`) — 660 originations
- **Morrison** (`27097`) — 641 originations
- **Nicollet** (`27103`) — 641 originations

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has state activity
- WI/MN curated: GLEIF-reidentified nationals + deepen regionals (Summit CU, UWCU, Landmark, Associated Bank, Bell Bank, TruStone, Affinity Plus, Blaze, Wings, Johnson Bank, Nicolet, Royal CU, and other high-volume LEI identities)
- NMLS filled only when verified (e.g. Landmark 401043, TruStone 523134); else LEI identity
- Remaining unmapped regionals deferred when no high-confidence directory link

## Rebuild

```bash
python scripts/build-hmda-wi-mn-slices.py
```

## Major slugs (for states.ts)

```
'hennepin', 'dakota', 'ramsey', 'anoka', 'washington', 'wright', 'st-louis', 'scott', 'olmsted', 'stearns', 'carver', 'sherburne', 'crow-wing', 'chisago', 'clay', 'rice', 'otter-tail', 'isanti', 'blue-earth', 'winona', 'goodhue', 'itasca', 'carlton', 'benton', 'mille-lacs', 'douglas', 'mcleod', 'cass', 'becker', 'mower', 'pine', 'kandiyohi', 'steele', 'le-sueur', 'morrison', 'nicollet'
```
