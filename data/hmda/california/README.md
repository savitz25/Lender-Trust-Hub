# California HMDA slice
- County market rows: **24**
- Lender–county activity (major counties): **10365**
- LEI state summaries: **978**
- High-confidence LEI→directory mappings: **54**
- Major counties with names: **24**

## Top mapped LEIs by CA originations

- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (57281 CA orig.)
- `rocket-mortgage` — Rocket Mortgage, LLC (42202 CA orig.)
- `guaranteed-rate` — Guaranteed Rate, Inc. (17758 CA orig.)
- `us-bank` — U.S. Bank National Association (16135 CA orig.)
- `jpmorgan-chase-bank` — JPMorgan Chase Bank, National Association (14032 CA orig.)
- `fairway-mortgage-augusta-sheppard` — Fairway Independent Mortgage Corporation (10749 CA orig.)
- `pennymac` — PennyMac Loan Services, LLC (9983 CA orig.)
- `wells-fargo-bank` — Wells Fargo Bank, National Association (9616 CA orig.)
- `freedom-mortgage` — Freedom Mortgage Corporation (9599 CA orig.)
- `cmg-home-loans-dennis-vo` — CMG Mortgage, Inc. (8432 CA orig.)
- `better-mortgage` — Better Mortgage Corporation (6742 CA orig.)
- `loandepot` — loanDepot.com, LLC (6607 CA orig.)
- `navy-federal-jacksonville` — Navy Federal Credit Union (6361 CA orig.)
- `mr-cooper` — Nationstar Mortgage LLC (6248 CA orig.)
- `newrez` — Newrez LLC (5772 CA orig.)
- `new-american-funding` — Broker Solutions, Inc. (5105 CA orig.)
- `amerihome-mortgage` — AmeriHome Mortgage Company, LLC (4698 CA orig.)
- `mr-cooper` — NATIONSTAR MORTGAGE LLC (4657 CA orig.)
- `ally-bank` — Ally Bank (4118 CA orig.)
- `prmg` — PARAMOUNT RESIDENTIAL MORTGAGE GROUP, INC. (3975 CA orig.)
- `guild-mortgage-silicon-valley` — Guild Mortgage Company LLC (3918 CA orig.)
- `american-pacific-mortgage-inland-empire` — AMERICAN PACIFIC MORTGAGE CORPORATION (3554 CA orig.)
- `homebridge-financial` — HOMEBRIDGE FINANCIAL SERVICES, INC. (3155 CA orig.)
- `primelending-columbus` — PrimeLending, a PlainsCapital Company (2867 CA orig.)
- `crosscountry-mortgage-silicon-valley` — CrossCountry Mortgage, LLC (2776 CA orig.)

## Major counties (panel-ready)

- **Los Angeles** (`06037`) — 106668 originations
- **San Diego** (`06073`) — 52503 originations
- **Riverside** (`06065`) — 48863 originations
- **Orange** (`06059`) — 45570 originations
- **San Bernardino** (`06071`) — 35747 originations
- **Sacramento** (`06067`) — 28763 originations
- **Santa Clara** (`06085`) — 25551 originations
- **Alameda** (`06001`) — 21941 originations
- **Contra Costa** (`06013`) — 19926 originations
- **Kern** (`06029`) — 14913 originations
- **Fresno** (`06019`) — 14101 originations
- **San Joaquin** (`06077`) — 13656 originations
- **Ventura** (`06111`) — 12642 originations
- **Placer** (`06061`) — 11189 originations
- **San Mateo** (`06081`) — 9709 originations
- **Solano** (`06095`) — 8223 originations
- **San Francisco** (`06075`) — 8060 originations
- **Sonoma** (`06097`) — 7918 originations
- **Stanislaus** (`06099`) — 7867 originations
- **Tulare** (`06107`) — 6843 originations
- **Santa Barbara** (`06083`) — 5402 originations
- **San Luis Obispo** (`06079`) — 4840 originations
- **Monterey** (`06053`) — 4435 originations
- **Marin** (`06041`) — 4126 originations

## Matching rules

- Reuse FL / TX / GA curated LEI maps when the LEI has CA activity
- National NMLS→slug overrides prefer company-level directory hosts
- No fuzzy LEI inventing

## Rebuild

```bash
python scripts/build-hmda-california-slice.py
```
