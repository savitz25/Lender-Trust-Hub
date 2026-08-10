# New Jersey HMDA slice
- County market rows: **21**
- Lender–county activity (major counties): **7549**
- LEI state summaries: **776**
- High-confidence LEI→directory mappings: **79**
- Major counties with names: **21**

## Top mapped LEIs by NJ originations

- `rocket-mortgage` — Rocket Mortgage, LLC (12035 NJ orig.)
- `freedom-mortgage` — Freedom Mortgage Corporation (7558 NJ orig.)
- `citizens-bank` — Citizens Bank, National Association (7208 NJ orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (7084 NJ orig.)
- `td-bank` — TD Bank, National Association (6695 NJ orig.)
- `pnc-bank` — PNC Bank, National Association (5755 NJ orig.)
- `guaranteed-rate` — Guaranteed Rate, Inc. (5136 NJ orig.)
- `mr-cooper` — Nationstar Mortgage LLC (4826 NJ orig.)
- `pennymac` — PennyMac Loan Services, LLC (4334 NJ orig.)
- `jpmorgan-chase-bank` — JPMorgan Chase Bank, National Association (3325 NJ orig.)
- `fairway-mortgage-augusta-sheppard` — Fairway Independent Mortgage Corporation (3144 NJ orig.)
- `amerihome-mortgage` — AmeriHome Mortgage Company, LLC (2257 NJ orig.)
- `oceanfirst-bank` — OceanFirst Bank, National Association (2071 NJ orig.)
- `newrez` — Newrez LLC (1951 NJ orig.)
- `anniemac-home-mortgage` — AMERICAN NEIGHBORHOOD MORTGAGE ACCEPTANCE COMPANY LLC (1899 NJ orig.)
- `advisors-mortgage-group` — Advisors Mortgage Group, L.L.C. (1831 NJ orig.)
- `wells-fargo-bank` — Wells Fargo Bank, National Association (1716 NJ orig.)
- `valley-national-bank` — Valley National Bank (1659 NJ orig.)
- `mr-cooper` — NATIONSTAR MORTGAGE LLC (1625 NJ orig.)
- `cardinal-financial` — Cardinal Financial Company, Limited Partnership (1579 NJ orig.)
- `absolute-home-mortgage` — ABSOLUTE HOME MORTGAGE CORPORATION (1569 NJ orig.)
- `navy-federal-jacksonville` — Navy Federal Credit Union (1515 NJ orig.)
- `mt-bank` — Manufacturers and Traders Trust Company (1501 NJ orig.)
- `prmg` — PARAMOUNT RESIDENTIAL MORTGAGE GROUP, INC. (1490 NJ orig.)
- `guild-mortgage-nj-suburbs` — Guild Mortgage Company LLC (1432 NJ orig.)

## Major counties (panel-ready)

- **Ocean** (`34029`) — 17229 originations
- **Bergen** (`34003`) — 15503 originations
- **Monmouth** (`34025`) — 15448 originations
- **Middlesex** (`34023`) — 14147 originations
- **Burlington** (`34005`) — 11791 originations
- **Camden** (`34007`) — 11712 originations
- **Essex** (`34013`) — 11644 originations
- **Morris** (`34027`) — 10494 originations
- **Union** (`34039`) — 8654 originations
- **Gloucester** (`34015`) — 8040 originations
- **Mercer** (`34021`) — 7366 originations
- **Hudson** (`34017`) — 7032 originations
- **Passaic** (`34031`) — 6997 originations
- **Somerset** (`34035`) — 6702 originations
- **Atlantic** (`34001`) — 6224 originations
- **Cape May** (`34009`) — 4121 originations
- **Sussex** (`34037`) — 4116 originations
- **Hunterdon** (`34019`) — 2982 originations
- **Cumberland** (`34011`) — 2744 originations
- **Warren** (`34041`) — 2736 originations
- **Salem** (`34033`) — 1643 originations

## Matching rules

- Reuse FL / TX / GA / CA / NC / SC curated LEI maps when the LEI has NJ activity
- National NMLS→slug overrides prefer company-level / NJ directory hosts
- No fuzzy LEI inventing

## Rebuild

```bash
python scripts/build-hmda-new-jersey-slice.py
```
