# Mississippi HMDA slice

**Source:** `data/hmda/by-state/MS/` (national 2025 foundation)

- County market rows: **18**
- Lender–county activity (major markets): **2894**
- LEI state summaries: **576**
- High-confidence LEI→directory mappings: **140**
- Major markets with names: **18**

## Top mapped LEIs by MS originations

- `trustmark-bank` — Trustmark Bank (4094 MS orig.)
- `cadence-bank` — Cadence Bank (3510 MS orig.)
- `community-bank-of-mississippi` — Community Bank of Mississippi (3017 MS orig.)
- `rocket-mortgage` — Rocket Mortgage, LLC (2997 MS orig.)
- `renasant-bank` — Renasant Bank (2189 MS orig.)
- `bankplus` — BankPlus (1973 MS orig.)
- `regions-bank` — Regions Bank (1886 MS orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (1430 MS orig.)
- `veterans-united-west-valley` — MORTGAGE RESEARCH CENTER, LLC (1220 MS orig.)
- `21st-mortgage` — 21ST MORTGAGE CORPORATION (1068 MS orig.)
- `guild-mortgage-metrowest` — GUILD MORTGAGE COMPANY LLC (808 MS orig.)
- `amerihome-mortgage` — AmeriHome Mortgage Company, LLC (770 MS orig.)
- `freedom-mortgage` — FREEDOM MORTGAGE CORPORATION (694 MS orig.)
- `dhi-mortgage-buckeye` — DHI MORTGAGE COMPANY, LTD. (645 MS orig.)
- `loandepot` — LOANDEPOT.COM, LLC (638 MS orig.)
- `navy-federal-jacksonville` — Navy Federal Credit Union (633 MS orig.)
- `pennymac` — PENNYMAC LOAN SERVICES, LLC (603 MS orig.)
- `new-american-funding` — NEW AMERICAN FUNDING, LLC (571 MS orig.)
- `crosscountry-mortgage-metrowest` — CROSSCOUNTRY MORTGAGE, LLC (539 MS orig.)
- `hancock-whitney-bank` — HANCOCK WHITNEY BANK (480 MS orig.)

## Major markets (panel-ready)

- **DeSoto** (`28033`) — 5176 originations
- **Harrison** (`28047`) — 4797 originations
- **Rankin** (`28121`) — 4363 originations
- **Hinds** (`28049`) — 3572 originations
- **Jackson** (`28059`) — 3272 originations
- **Madison** (`28089`) — 2962 originations
- **Lee** (`28081`) — 1784 originations
- **Lafayette** (`28071`) — 1654 originations
- **Lamar** (`28073`) — 1486 originations
- **Forrest** (`28035`) — 1453 originations
- **Jones** (`28067`) — 1236 originations
- **Hancock** (`28045`) — 1223 originations
- **Pearl River** (`28109`) — 1210 originations
- **Lowndes** (`28087`) — 1063 originations
- **Lauderdale** (`28075`) — 1029 originations
- **Marshall** (`28093`) — 839 originations
- **Oktibbeha** (`28105`) — 833 originations
- **Warren** (`28149`) — 608 originations

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
'desoto', 'harrison', 'rankin', 'hinds', 'jackson', 'madison', 'lee', 'lafayette', 'lamar', 'forrest', 'jones', 'hancock', 'pearl-river', 'lowndes', 'lauderdale', 'marshall', 'oktibbeha', 'warren'
```
