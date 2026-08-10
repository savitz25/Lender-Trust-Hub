# New York HMDA slice

**Source:** `data/hmda/by-state/NY/` (national 2025 foundation)

- County market rows: **62**
- Lender–county activity (major counties): **7709**
- LEI state summaries: **630**
- High-confidence LEI→directory mappings: **72**
- Major counties with names: **48**

## Top mapped LEIs by NY originations

- `rocket-mortgage` — Rocket Mortgage, LLC (13729 NY orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (11157 NY orig.)
- `citizens-bank` — Citizens Bank, National Association (11000 NY orig.)
- `jpmorgan-chase-bank` — JPMorgan Chase Bank, National Association (9163 NY orig.)
- `mt-bank` — Manufacturers and Traders Trust Company (7073 NY orig.)
- `freedom-mortgage` — Freedom Mortgage Corporation (5429 NY orig.)
- `premium-mortgage` — PREMIUM MORTGAGE CORPORATION (5094 NY orig.)
- `td-bank` — TD Bank, National Association (4324 NY orig.)
- `homestead-funding` — HOMESTEAD FUNDING CORP. (4005 NY orig.)
- `guaranteed-rate` — Guaranteed Rate, Inc. (3897 NY orig.)
- `citibank` — Citibank, National Association (3687 NY orig.)
- `newrez` — Newrez LLC (3123 NY orig.)
- `wells-fargo-bank` — Wells Fargo Bank, National Association (2733 NY orig.)
- `pennymac` — PennyMac Loan Services, LLC (2612 NY orig.)
- `fairway-mortgage-augusta-sheppard` — Fairway Independent Mortgage Corporation (2278 NY orig.)
- `nationwide-mortgage-bankers` — NATIONWIDE MORTGAGE BANKERS, INC. (2070 NY orig.)
- `nbt-bank` — NBT Bank, National Association (1922 NY orig.)
- `contour-mortgage` — CONTOUR MORTGAGE CORPORATION (1919 NY orig.)
- `1st-priority-mortgage` — 1ST PRIORITY MORTGAGE, INC. (1691 NY orig.)
- `homebridge-financial` — HOMEBRIDGE FINANCIAL SERVICES, INC. (1590 NY orig.)
- `cardinal-financial` — Cardinal Financial Company, Limited Partnership (1485 NY orig.)
- `navy-federal-jacksonville` — Navy Federal Credit Union (1476 NY orig.)
- `amerihome-mortgage` — AmeriHome Mortgage Company, LLC (1410 NY orig.)
- `us-bank` — U.S. Bank National Association (1313 NY orig.)
- `primelending-columbus` — PRIMELENDING, A PLAINSCAPITAL COMPANY (1278 NY orig.)

## Major counties (panel-ready)

- **Suffolk** (`36103`) — 26408 originations
- **Nassau** (`36059`) — 19225 originations
- **Erie** (`36029`) — 16228 originations
- **Monroe** (`36055`) — 15921 originations
- **Queens** (`36081`) — 13998 originations
- **Kings** (`36047`) — 12897 originations
- **Westchester** (`36119`) — 12210 originations
- **Onondaga** (`36067`) — 8764 originations
- **New York** (`36061`) — 7521 originations
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
- **Ontario** (`36069`) — 2413 originations
- **Oswego** (`36075`) — 2251 originations
- **Wayne** (`36117`) — 2022 originations
- **Jefferson** (`36045`) — 1984 originations
- **Putnam** (`36079`) — 1878 originations
- **Steuben** (`36101`) — 1685 originations
- **Chautauqua** (`36013`) — 1656 originations
- **Sullivan** (`36105`) — 1638 originations
- **Chemung** (`36015`) — 1394 originations
- **Warren** (`36113`) — 1255 originations
- **Madison** (`36053`) — 1246 originations
- **Cayuga** (`36011`) — 1226 originations
- **Columbia** (`36021`) — 1160 originations
- **Tompkins** (`36109`) — 1122 originations
- **Livingston** (`36051`) — 1096 originations
- **Herkimer** (`36043`) — 1043 originations
- **Greene** (`36039`) — 988 originations
- **Washington** (`36115`) — 987 originations
- **Genesee** (`36037`) — 927 originations
- **St. Lawrence** (`36089`) — 898 originations
- **Fulton** (`36035`) — 893 originations
- **Clinton** (`36019`) — 891 originations
- **Cattaraugus** (`36009`) — 888 originations
- **Montgomery** (`36057`) — 832 originations
- **Tioga** (`36107`) — 821 originations
- **Otsego** (`36077`) — 818 originations

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has NY activity
- National NMLS→slug overrides prefer company-level hosts
- NY curated LEIs: high-confidence GLEIF name + published company NMLS only
- No fuzzy LEI inventing

## Rebuild

```bash
python scripts/process_hmda_national.py year_2025.csv  # if partition missing
python scripts/build-hmda-new-york-slice.py
```
