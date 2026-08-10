# South Carolina HMDA slice
- County market rows: **21**
- Lender–county activity (major counties): **6986**
- LEI state summaries: **1009**
- High-confidence LEI→directory mappings: **63**
- Major counties with names: **20**

## Top mapped LEIs by SC originations

- `rocket-mortgage` — Rocket Mortgage, LLC (9760 SC orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (6429 SC orig.)
- `crosscountry-mortgage-west-valley` — CrossCountry Mortgage, LLC (4153 SC orig.)
- `cardinal-financial` — Cardinal Financial Company, Limited Partnership (2978 SC orig.)
- `southstate-bank` — SouthState Bank, National Association (2816 SC orig.)
- `loandepot` — loanDepot.com, LLC (2694 SC orig.)
- `pennymac` — PennyMac Loan Services, LLC (2670 SC orig.)
- `ally-bank` — Ally Bank (2670 SC orig.)
- `navy-federal-jacksonville` — Navy Federal Credit Union (2487 SC orig.)
- `movement-mortgage-myrtle-beach` — Movement Mortgage, LLC (2333 SC orig.)
- `freedom-mortgage` — Freedom Mortgage Corporation (2233 SC orig.)
- `fairway-mortgage-augusta-sheppard` — Fairway Independent Mortgage Corporation (2199 SC orig.)
- `truist-bank` — Truist Bank (2178 SC orig.)
- `guild-mortgage-grand-strand` — Guild Mortgage Company LLC (2168 SC orig.)
- `guaranteed-rate` — Guaranteed Rate, Inc. (2119 SC orig.)
- `ameris-bank` — Ameris Bank (1857 SC orig.)
- `primelending-columbus` — PRIMELENDING, A PLAINSCAPITAL COMPANY (1561 SC orig.)
- `newrez` — Newrez LLC (1334 SC orig.)
- `primelending-columbus` — PrimeLending, a PlainsCapital Company (1326 SC orig.)
- `amerihome-mortgage` — AmeriHome Mortgage Company, LLC (1264 SC orig.)
- `mr-cooper` — NATIONSTAR MORTGAGE LLC (1255 SC orig.)
- `21st-mortgage` — 21ST MORTGAGE CORPORATION (1207 SC orig.)
- `prmg` — Paramount Residential Mortgage Group, Inc. (1148 SC orig.)
- `td-bank` — TD Bank, National Association (1143 SC orig.)
- `mr-cooper` — Nationstar Mortgage LLC (1134 SC orig.)

## Major counties (panel-ready)

- **Horry** (`45051`) — 15158 originations
- **Greenville** (`45045`) — 14241 originations
- **Charleston** (`45019`) — 11606 originations
- **Spartanburg** (`45083`) — 10852 originations
- **Richland** (`45079`) — 10401 originations
- **Berkeley** (`45015`) — 8999 originations
- **York** (`45091`) — 8940 originations
- **Lexington** (`45063`) — 8577 originations
- **Beaufort** (`45013`) — 6565 originations
- **Dorchester** (`45035`) — 5504 originations
- **Anderson** (`45007`) — 5433 originations
- **Aiken** (`45003`) — 4659 originations
- **Lancaster** (`45057`) — 3547 originations
- **Sumter** (`45077`) — 2960 originations
- **Florence** (`45041`) — 2332 originations
- **Pickens** (`45073`) — 2006 originations
- **Kershaw** (`45055`) — 1732 originations
- **Laurens** (`45059`) — 1714 originations
- **Jasper** (`45053`) — 1574 originations
- **Georgetown** (`45043`) — 1475 originations

## Matching rules

- Reuse FL / TX / GA / CA / NC curated LEI maps when the LEI has SC activity
- National NMLS→slug overrides prefer company-level / SC directory hosts
- No fuzzy LEI inventing

## Rebuild

```bash
python scripts/build-hmda-south-carolina-slice.py
```
