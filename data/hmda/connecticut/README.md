# Connecticut HMDA slice

**Source:** `data/hmda/by-state/CT/` (national 2025 foundation)

**Geography note:** Connecticut HMDA uses Census **planning-region** county-equivalents (FIPS 09110–09190), not the legacy eight county codes.

- County market rows: **9**
- Lender–county activity (major counties): **2865**
- LEI state summaries: **607**
- High-confidence LEI→directory mappings: **99**
- Major counties with names: **9**

## Top mapped LEIs by CT originations

- `rocket-mortgage` — Rocket Mortgage, LLC (4505 CT orig.)
- `total-mortgage-services` — TOTAL MORTGAGE SERVICES, LLC (3299 CT orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (3084 CT orig.)
- `citizens-bank` — Citizens Bank, National Association (3030 CT orig.)
- `liberty-bank` — Liberty Bank (2765 CT orig.)
- `mt-bank` — Manufacturers and Traders Trust Company (2398 CT orig.)
- `guaranteed-rate` — Guaranteed Rate, Inc. (2061 CT orig.)
- `first-world-mortgage` — FIRST WORLD MORTGAGE CORPORATION (2009 CT orig.)
- `amerihome-mortgage` — AmeriHome Mortgage Company, LLC (1504 CT orig.)
- `freedom-mortgage` — Freedom Mortgage Corporation (1294 CT orig.)
- `jpmorgan-chase-bank` — JPMorgan Chase Bank, National Association (1171 CT orig.)
- `us-bank` — U.S. Bank National Association (1147 CT orig.)
- `cardinal-financial` — Cardinal Financial Company, Limited Partnership (1093 CT orig.)
- `td-bank` — TD Bank, National Association (1002 CT orig.)
- `pennymac` — PennyMac Loan Services, LLC (945 CT orig.)
- `newrez` — Newrez LLC (874 CT orig.)
- `prosperity-home-mortgage` — Prosperity Home Mortgage, LLC (862 CT orig.)
- `mr-cooper` — Nationstar Mortgage LLC (843 CT orig.)
- `navy-federal-jacksonville` — Navy Federal Credit Union (812 CT orig.)
- `fairway-mortgage-augusta-sheppard` — Fairway Independent Mortgage Corporation (802 CT orig.)

## Major counties / regions (panel-ready)

- **Capitol** (`09110`) — 20452 originations
- **Western Connecticut** (`09190`) — 11705 originations
- **South Central Connecticut** (`09170`) — 10682 originations
- **Naugatuck Valley** (`09140`) — 9683 originations
- **Southeastern Connecticut** (`09180`) — 6281 originations
- **Greater Bridgeport** (`09120`) — 5682 originations
- **Lower Connecticut River Valley** (`09130`) — 4368 originations
- **Northeastern Connecticut** (`09150`) — 2614 originations
- **Northwest Hills** (`09160`) — 2565 originations

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has state activity
- CT/NH curated: Liberty Bank, First World Mortgage, Service Credit Union, St. Mary's Bank
- No fuzzy LEI inventing

## Rebuild

```bash
python scripts/build-hmda-ct-nh-slices.py
```
