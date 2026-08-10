# Minnesota HMDA slice

**Source:** `data/hmda/by-state/MN/` (national 2025 foundation)

- County market rows: **25**
- Lender–county activity (major markets): **5041**
- LEI state summaries: **772**
- High-confidence LEI→directory mappings: **109**
- Major markets with names: **20**

## Top mapped LEIs by MN originations

- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (6703 MN orig.)
- `rocket-mortgage` — Rocket Mortgage, LLC (5672 MN orig.)
- `us-bank` — U.S. Bank National Association (4538 MN orig.)
- `crosscountry-mortgage-metrowest` — CROSSCOUNTRY MORTGAGE, LLC (3129 MN orig.)
- `fairway-mortgage-augusta-sheppard` — FAIRWAY INDEPENDENT MORTGAGE CORPORATION (2657 MN orig.)
- `old-national-bank` — Old National Bank (1877 MN orig.)
- `new-american-funding` — Broker Solutions, Inc. (1842 MN orig.)
- `prosperity-home-mortgage` — Prosperity Home Mortgage, LLC (1746 MN orig.)
- `huntington-national-bank` — The Huntington National Bank (1707 MN orig.)
- `pennymac` — PENNYMAC LOAN SERVICES, LLC (1705 MN orig.)
- `guaranteed-rate` — GUARANTEED RATE, INC. (1552 MN orig.)
- `wells-fargo-bank` — Wells Fargo Bank, National Association (1496 MN orig.)
- `loandepot` — LOANDEPOT.COM, LLC (1400 MN orig.)
- `lennar-mortgage-queen-creek` — LENNAR MORTGAGE, LLC (1365 MN orig.)
- `veterans-united-west-valley` — MORTGAGE RESEARCH CENTER, LLC (1143 MN orig.)
- `newrez` — Newrez LLC (1057 MN orig.)
- `academy-mortgage` — Academy Mortgage Corporation (915 MN orig.)
- `guild-mortgage-metrowest` — GUILD MORTGAGE COMPANY LLC (801 MN orig.)
- `mr-cooper` — NATIONSTAR MORTGAGE LLC (795 MN orig.)
- `freedom-mortgage` — FREEDOM MORTGAGE CORPORATION (765 MN orig.)

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
'hennepin', 'dakota', 'ramsey', 'anoka', 'washington', 'wright', 'st-louis', 'scott', 'olmsted', 'stearns', 'carver', 'sherburne', 'crow-wing', 'chisago', 'clay', 'rice', 'otter-tail', 'isanti', 'blue-earth', 'winona'
```
