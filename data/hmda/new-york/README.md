# New York HMDA slice

**Source:** `data/hmda/by-state/NY/` (national 2025 foundation)

- County market rows: **62**
- Lender–county activity (major counties): **4868**
- LEI state summaries: **630**
- High-confidence LEI→directory mappings: **56**
- Major counties with names: **22**

## Top mapped LEIs by NY originations

- `rocket-mortgage` — Rocket Mortgage, LLC (13729 NY orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (11157 NY orig.)
- `citizens-bank` — Citizens Bank, National Association (11000 NY orig.)
- `jpmorgan-chase-bank` — JPMorgan Chase Bank, National Association (9163 NY orig.)
- `mt-bank` — Manufacturers and Traders Trust Company (7073 NY orig.)
- `freedom-mortgage` — Freedom Mortgage Corporation (5429 NY orig.)
- `td-bank` — TD Bank, National Association (4324 NY orig.)
- `guaranteed-rate` — Guaranteed Rate, Inc. (3897 NY orig.)
- `citibank` — Citibank, National Association (3687 NY orig.)
- `newrez` — Newrez LLC (3123 NY orig.)
- `wells-fargo-bank` — Wells Fargo Bank, National Association (2733 NY orig.)
- `pennymac` — PennyMac Loan Services, LLC (2612 NY orig.)
- `fairway-mortgage-augusta-sheppard` — Fairway Independent Mortgage Corporation (2278 NY orig.)
- `homebridge-financial` — HOMEBRIDGE FINANCIAL SERVICES, INC. (1590 NY orig.)
- `cardinal-financial` — Cardinal Financial Company, Limited Partnership (1485 NY orig.)
- `navy-federal-jacksonville` — Navy Federal Credit Union (1476 NY orig.)
- `amerihome-mortgage` — AmeriHome Mortgage Company, LLC (1410 NY orig.)
- `us-bank` — U.S. Bank National Association (1313 NY orig.)
- `primelending-columbus` — PRIMELENDING, A PLAINSCAPITAL COMPANY (1278 NY orig.)
- `mr-cooper` — Nationstar Mortgage LLC (1116 NY orig.)
- `mr-cooper` — NATIONSTAR MORTGAGE LLC (959 NY orig.)
- `new-american-funding` — Broker Solutions, Inc. (937 NY orig.)
- `movement-mortgage` — Movement Mortgage, LLC (849 NY orig.)
- `american-financial-network` — AMERICAN FINANCIAL NETWORK, INC. (827 NY orig.)
- `anniemac-home-mortgage` — AMERICAN NEIGHBORHOOD MORTGAGE ACCEPTANCE COMPANY LLC (768 NY orig.)

## Major counties (panel-ready)

- **Suffolk** (`36103`) — 26408 originations
- **Nassau** (`36059`) — 19225 originations
- **Erie** (`36029`) — 16228 originations
- **Monroe** (`36055`) — 15921 originations
- **Queens** (`36081`) — 13998 originations
- **Kings** (`36047`) — 12897 originations
- **Westchester** (`36119`) — 12210 originations
- **Onondaga** (`36067`) — 8764 originations
- **New York / Manhattan** (`36061`) — 7521 originations · site slug `new-york-county`
- **Orange** (`36071`) — 7180 originations
- **Albany** (`36001`) — 5656 originations
- **Richmond** (`36085`) — 5382 originations
- **Dutchess** (`36027`) — 5064 originations
- **Saratoga** (`36091`) — 4898 originations
- **Rockland** (`36087`) — 4849 originations
- **Bronx** (`36005`) — 3990 originations
- **Niagara** (`36063`) — 3894 originations
- **Oneida** (`36065`) — 3752 originations
- **Schenectady** (`36093`) — 3225 originations
- **Rensselaer** (`36083`) — 3088 originations
- **Ulster** (`36111`) — 3041 originations
- **Broome** (`36007`) — 2919 originations

## Matching rules

- Reuse FL / TX / GA / CA / NC / SC / NJ curated LEI maps when the LEI has NY activity
- National NMLS→slug overrides prefer company-level hosts
- No fuzzy LEI inventing

## Rebuild

```bash
python scripts/process_hmda_national.py year_2025.csv  # if partition missing
python scripts/build-hmda-new-york-slice.py
```
