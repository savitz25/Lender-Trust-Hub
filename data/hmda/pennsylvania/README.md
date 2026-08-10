# Pennsylvania HMDA slice
- County market rows: **34**
- Lender–county activity (major counties): **9219**
- LEI state summaries: **994**
- High-confidence LEI→directory mappings: **79**
- Major counties with names: **30**

## Top mapped LEIs by PA originations

- `rocket-mortgage` — Rocket Mortgage, LLC (16043 PA orig.)
- `pnc-bank` — PNC Bank, National Association (11263 PA orig.)
- `citizens-bank` — Citizens Bank, National Association (10441 PA orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (9333 PA orig.)
- `freedom-mortgage` — Freedom Mortgage Corporation (8399 PA orig.)
- `fairway-mortgage-augusta-sheppard` — Fairway Independent Mortgage Corporation (4488 PA orig.)
- `cardinal-financial` — Cardinal Financial Company, Limited Partnership (3902 PA orig.)
- `ally-bank` — Ally Bank (3258 PA orig.)
- `mr-cooper` — Nationstar Mortgage LLC (3119 PA orig.)
- `mt-bank` — Manufacturers and Traders Trust Company (3099 PA orig.)
- `movement-mortgage-charlotte` — Movement Mortgage, LLC (2643 PA orig.)
- `amerihome-mortgage` — AmeriHome Mortgage Company, LLC (2626 PA orig.)
- `prosperity-home-mortgage` — Prosperity Home Mortgage, LLC (2325 PA orig.)
- `truist-bank` — Truist Bank (2152 PA orig.)
- `new-american-funding` — Broker Solutions, Inc. (2148 PA orig.)
- `navy-federal-jacksonville` — Navy Federal Credit Union (2141 PA orig.)
- `newrez` — Newrez LLC (2124 PA orig.)
- `pennymac` — PennyMac Loan Services, LLC (2123 PA orig.)
- `union-home-mortgage-myrtle-beach` — UNION HOME MORTGAGE CORP. (1934 PA orig.)
- `guaranteed-rate` — Guaranteed Rate, Inc. (1841 PA orig.)
- `td-bank` — TD Bank, National Association (1803 PA orig.)
- `mr-cooper` — NATIONSTAR MORTGAGE LLC (1746 PA orig.)
- `guild-mortgage-nj-suburbs` — Guild Mortgage Company LLC (1673 PA orig.)
- `jpmorgan-chase-bank` — JPMorgan Chase Bank, National Association (1667 PA orig.)
- `wells-fargo-bank` — Wells Fargo Bank, National Association (1628 PA orig.)

## Major counties (panel-ready)

- **Allegheny** (`42003`) — 26765 originations
- **Philadelphia** (`42101`) — 24937 originations
- **Montgomery** (`42091`) — 19325 originations
- **Bucks** (`42017`) — 14376 originations
- **Chester** (`42029`) — 13202 originations
- **York** (`42133`) — 12502 originations
- **Delaware** (`42045`) — 12101 originations
- **Lancaster** (`42071`) — 11699 originations
- **Berks** (`42011`) — 9491 originations
- **Westmoreland** (`42129`) — 8236 originations
- **Lehigh** (`42077`) — 7771 originations
- **Northampton** (`42095`) — 6891 originations
- **Luzerne** (`42079`) — 6634 originations
- **Dauphin** (`42043`) — 6555 originations
- **Cumberland** (`42041`) — 6526 originations
- **Butler** (`42019`) — 4985 originations
- **Erie** (`42049`) — 4891 originations
- **Washington** (`42125`) — 4857 originations
- **Lackawanna** (`42069`) — 4538 originations
- **Monroe** (`42089`) — 4450 originations
- **Franklin** (`42055`) — 3891 originations
- **Beaver** (`42007`) — 3885 originations
- **Lebanon** (`42075`) — 3149 originations
- **Centre** (`42027`) — 2647 originations
- **Schuylkill** (`42107`) — 2624 originations
- **Adams** (`42001`) — 2615 originations
- **Fayette** (`42051`) — 2394 originations
- **Lycoming** (`42081`) — 2367 originations
- **Cambria** (`42021`) — 2188 originations
- **Mercer** (`42085`) — 2005 originations

## Matching rules

- Reuse FL / TX / GA / CA / NC / SC / NJ curated LEI maps when the LEI has PA activity
- National NMLS→slug overrides prefer company-level directory hosts
- No fuzzy LEI inventing; no New York product files touched

## Rebuild

```bash
python scripts/build-hmda-pennsylvania-slice.py
```
