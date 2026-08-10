# Wisconsin HMDA slice

**Source:** `data/hmda/by-state/WI/` (national 2025 foundation)

- County market rows: **42**
- Lender–county activity (major markets): **4972**
- LEI state summaries: **843**
- High-confidence LEI→directory mappings: **112**
- Major markets with names: **20**

## Top mapped LEIs by WI originations

- `rocket-mortgage` — Rocket Mortgage, LLC (5736 WI orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (3258 WI orig.)
- `bmo-bank` — BMO Bank National Association (2970 WI orig.)
- `fairway-mortgage-augusta-sheppard` — FAIRWAY INDEPENDENT MORTGAGE CORPORATION (2947 WI orig.)
- `us-bank` — U.S. Bank National Association (2785 WI orig.)
- `guild-mortgage-metrowest` — GUILD MORTGAGE COMPANY LLC (2260 WI orig.)
- `veterans-united-west-valley` — MORTGAGE RESEARCH CENTER, LLC (1743 WI orig.)
- `jpmorgan-chase-bank` — JPMorgan Chase Bank, National Association (1346 WI orig.)
- `newrez` — Newrez LLC (1295 WI orig.)
- `pennymac` — PENNYMAC LOAN SERVICES, LLC (1253 WI orig.)
- `wintrust-mortgage` — Barrington Bank & Trust Company, National Association (1224 WI orig.)
- `guaranteed-rate` — GUARANTEED RATE, INC. (1168 WI orig.)
- `crosscountry-mortgage-metrowest` — CROSSCOUNTRY MORTGAGE, LLC (1070 WI orig.)
- `loandepot` — LOANDEPOT.COM, LLC (956 WI orig.)
- `freedom-mortgage` — FREEDOM MORTGAGE CORPORATION (918 WI orig.)
- `mr-cooper` — NATIONSTAR MORTGAGE LLC (873 WI orig.)
- `old-national-bank` — Old National Bank (824 WI orig.)
- `prosperity-home-mortgage` — Prosperity Home Mortgage, LLC (782 WI orig.)
- `american-pacific-mortgage-inland-empire` — AMERICAN PACIFIC MORTGAGE CORPORATION (741 WI orig.)
- `huntington-national-bank` — The Huntington National Bank (664 WI orig.)

## Major markets (panel-ready)

- **Milwaukee** (`55079`) — 19382 originations
- **Dane** (`55025`) — 16273 originations
- **Waukesha** (`55133`) — 12607 originations
- **Brown** (`55009`) — 7322 originations
- **Outagamie** (`55087`) — 5623 originations
- **Racine** (`55101`) — 5489 originations
- **Rock** (`55105`) — 5139 originations
- **Winnebago** (`55139`) — 4659 originations
- **Kenosha** (`55059`) — 4043 originations
- **Washington** (`55131`) — 4036 originations
- **Marathon** (`55073`) — 3467 originations
- **Sheboygan** (`55117`) — 2973 originations
- **La Crosse** (`55063`) — 2910 originations
- **Walworth** (`55127`) — 2877 originations
- **St. Croix** (`55109`) — 2808 originations
- **Fond du Lac** (`55039`) — 2673 originations
- **Ozaukee** (`55089`) — 2529 originations
- **Eau Claire** (`55035`) — 2498 originations
- **Dodge** (`55027`) — 2492 originations
- **Manitowoc** (`55071`) — 2251 originations

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has state activity
- WI/MN curated: GLEIF-reidentified nationals (Fairway, PennyMac, Guaranteed Rate, loanDepot, CrossCountry, Guild, Veterans United/MRC, Lennar, Freedom, Huntington, Old National, BMO, Academy, Wintrust family)
- Regional credit unions without directory profiles deferred (no thin inventing)

## Rebuild

```bash
python scripts/build-hmda-wi-mn-slices.py
```

## Major slugs (for states.ts)

```
'milwaukee', 'dane', 'waukesha', 'brown', 'outagamie', 'racine', 'rock', 'winnebago', 'kenosha', 'washington', 'marathon', 'sheboygan', 'la-crosse', 'walworth', 'st-croix', 'fond-du-lac', 'ozaukee', 'eau-claire', 'dodge', 'manitowoc'
```
