# Oklahoma HMDA slice

**Source:** `data/hmda/by-state/OK/` (national 2025 foundation)

- County market rows: **26**
- Lender–county activity (major markets): **3991**
- LEI state summaries: **733**
- High-confidence LEI→directory mappings: **151**
- Major markets with names: **18**

## Top mapped LEIs by OK originations

- `rocket-mortgage` — Rocket Mortgage, LLC (4587 OK orig.)
- `first-united-bank-and-trust` — First United Bank and Trust Company (3985 OK orig.)
- `bancfirst` — BancFirst (3786 OK orig.)
- `arvest-bank` — Arvest Bank (3409 OK orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (2497 OK orig.)
- `bok-financial` — BOKF, National Association (2384 OK orig.)
- `veterans-united-west-valley` — MORTGAGE RESEARCH CENTER, LLC (1899 OK orig.)
- `gateway-mortgage-myrtle-beach` — Gateway First Bank (1547 OK orig.)
- `flat-branch-mortgage` — FLAT BRANCH MORTGAGE, INC. (1425 OK orig.)
- `pennymac` — PENNYMAC LOAN SERVICES, LLC (1012 OK orig.)
- `ttcu-federal-credit-union` — TTCU Federal Credit Union (984 OK orig.)
- `21st-mortgage` — 21ST MORTGAGE CORPORATION (888 OK orig.)
- `freedom-mortgage` — FREEDOM MORTGAGE CORPORATION (846 OK orig.)
- `navy-federal-jacksonville` — Navy Federal Credit Union (811 OK orig.)
- `guild-mortgage-metrowest` — GUILD MORTGAGE COMPANY LLC (774 OK orig.)
- `midfirst-bank` — MidFirst Bank (728 OK orig.)
- `dhi-mortgage-buckeye` — DHI MORTGAGE COMPANY, LTD. (717 OK orig.)
- `loandepot` — LOANDEPOT.COM, LLC (640 OK orig.)
- `jpmorgan-chase-bank` — JPMorgan Chase Bank, National Association (602 OK orig.)
- `newrez` — Newrez LLC (588 OK orig.)

## Major markets (panel-ready)

- **Oklahoma** (`40109`) — 16091 originations
- **Tulsa** (`40143`) — 13453 originations
- **Cleveland** (`40027`) — 6100 originations
- **Canadian** (`40017`) — 5232 originations
- **Wagoner** (`40145`) — 2684 originations
- **Comanche** (`40031`) — 2543 originations
- **Rogers** (`40131`) — 2337 originations
- **Logan** (`40083`) — 1553 originations
- **Pottawatomie** (`40125`) — 1543 originations
- **Creek** (`40037`) — 1538 originations
- **Grady** (`40051`) — 1487 originations
- **McClain** (`40087`) — 1378 originations
- **Payne** (`40119`) — 1247 originations
- **Muskogee** (`40101`) — 1145 originations
- **Garfield** (`40047`) — 977 originations
- **Washington** (`40147`) — 965 originations
- **Bryan** (`40013`) — 945 originations
- **Carter** (`40019`) — 902 originations

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has activity in this state
- AR curated: Arvest, Arkansas FCU, FirstTrust, First Security Bank, Centennial, Bank OZK, Simmons
- MS curated: Community Bank of Mississippi, BankPlus (+ Trustmark / Cadence / Renasant reuse)
- OK curated: BancFirst, MidFirst, TTCU, First United (+ BOK / Gateway / Arvest reuse)
- National LEI re-identify for UWM, Rocket, Regions, Guild, Freedom, etc.
- Precision over coverage — no fuzzy LEI inventing

## Rebuild

```bash
python scripts/build-hmda-ar-ms-ok-slices.py
```

## Major slugs (for states.ts)

```
'oklahoma', 'tulsa', 'cleveland', 'canadian', 'wagoner', 'comanche', 'rogers', 'logan', 'pottawatomie', 'creek', 'grady', 'mcclain', 'payne', 'muskogee', 'garfield', 'washington', 'bryan', 'carter'
```
