# Wisconsin HMDA slice

**Source:** `data/hmda/by-state/WI/` (national 2025 foundation)

- County market rows: **42**
- Lender–county activity (major markets): **7992**
- LEI state summaries: **843**
- High-confidence LEI→directory mappings: **133**
- Major markets with names: **40**

## Top mapped LEIs by WI originations

- `summit-credit-union` — Summit Credit Union (11322 WI orig.)
- `university-of-wisconsin-credit-union` — University Of Wisconsin Credit Union (8766 WI orig.)
- `landmark-credit-union` — Landmark Credit Union (6662 WI orig.)
- `rocket-mortgage` — Rocket Mortgage, LLC (5736 WI orig.)
- `associated-bank` — Associated Bank, National Association (4974 WI orig.)
- `covantage-credit-union` — COVANTAGE CREDIT UNION (3632 WI orig.)
- `community-first-credit-union-wi` — Community First Credit Union (3509 WI orig.)
- `educators-credit-union` — EDUCATORS CREDIT UNION (3267 WI orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (3258 WI orig.)
- `johnson-bank` — Johnson Bank (3047 WI orig.)
- `bmo-bank` — BMO Bank National Association (2970 WI orig.)
- `fairway-mortgage-augusta-sheppard` — FAIRWAY INDEPENDENT MORTGAGE CORPORATION (2947 WI orig.)
- `royal-credit-union` — Royal Credit Union (2893 WI orig.)
- `us-bank` — U.S. Bank National Association (2785 WI orig.)
- `fox-communities-credit-union` — FOX COMMUNITIES CREDIT UNION (2436 WI orig.)
- `nicolet-national-bank` — Nicolet National Bank (2279 WI orig.)
- `guild-mortgage-metrowest` — GUILD MORTGAGE COMPANY LLC (2260 WI orig.)
- `capital-credit-union-wi` — CAPITAL Credit Union (2012 WI orig.)
- `bank-first-na` — Bank First, N.A. (1810 WI orig.)
- `veterans-united-west-valley` — MORTGAGE RESEARCH CENTER, LLC (1743 WI orig.)

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
- **Jefferson** (`55055`) — 2188 originations
- **Columbia** (`55021`) — 2026 originations
- **Sauk** (`55111`) — 1767 originations
- **Calumet** (`55015`) — 1555 originations
- **Chippewa** (`55017`) — 1537 originations
- **Wood** (`55141`) — 1496 originations
- **Waupaca** (`55135`) — 1457 originations
- **Polk** (`55095`) — 1409 originations
- **Portage** (`55097`) — 1390 originations
- **Oconto** (`55083`) — 1367 originations
- **Barron** (`55005`) — 1195 originations
- **Marinette** (`55075`) — 1167 originations
- **Shawano** (`55115`) — 1166 originations
- **Douglas** (`55031`) — 1161 originations
- **Oneida** (`55085`) — 1083 originations
- **Monroe** (`55081`) — 1064 originations
- **Door** (`55029`) — 1063 originations
- **Pierce** (`55093`) — 1012 originations
- **Green** (`55045`) — 1001 originations
- **Dunn** (`55033`) — 985 originations

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
'milwaukee', 'dane', 'waukesha', 'brown', 'outagamie', 'racine', 'rock', 'winnebago', 'kenosha', 'washington', 'marathon', 'sheboygan', 'la-crosse', 'walworth', 'st-croix', 'fond-du-lac', 'ozaukee', 'eau-claire', 'dodge', 'manitowoc', 'jefferson', 'columbia', 'sauk', 'calumet', 'chippewa', 'wood', 'waupaca', 'polk', 'portage', 'oconto', 'barron', 'marinette', 'shawano', 'douglas', 'oneida', 'monroe', 'door', 'pierce', 'green', 'dunn'
```
