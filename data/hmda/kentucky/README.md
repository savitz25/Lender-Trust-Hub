# Kentucky HMDA slice

**Source:** `data/hmda/by-state/KY/` (national 2025 foundation)

- County market rows: **26**
- Lender–county activity (major markets): **3738**
- LEI state summaries: **751**
- High-confidence LEI→directory mappings: **157**
- Major markets with names: **18**

## Top mapped LEIs by KY originations

- `rocket-mortgage` — Rocket Mortgage, LLC (6049 KY orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (5242 KY orig.)
- `eagle-home-mortgage` — Eagle Home Mortgage, LLC (3150 KY orig.)
- `us-bank` — U.S. Bank National Association (2645 KY orig.)
- `stockton-mortgage` — STOCKTON MORTGAGE CORPORATION (2250 KY orig.)
- `pnc-bank` — PNC Bank, National Association (2095 KY orig.)
- `community-trust-bank` — Community Trust Bank, Inc. (2051 KY orig.)
- `stock-yards-bank-trust` — Stock Yards Bank & Trust Company (2044 KY orig.)
- `commonwealth-federal-credit-union` — COMMONWEALTH FEDERAL CREDIT UNION (1869 KY orig.)
- `veterans-united-west-valley` — MORTGAGE RESEARCH CENTER, LLC (1786 KY orig.)
- `liberty-federal-credit-union` — Liberty Credit Union (1771 KY orig.)
- `republic-bank-trust-kentucky` — Republic Bank & Trust Company (1477 KY orig.)
- `freedom-mortgage` — FREEDOM MORTGAGE CORPORATION (1270 KY orig.)
- `first-financial-bank-ohio` — First Financial Bank (1239 KY orig.)
- `benchmark-mortgage` — ARK-LA-TEX FINANCIAL SERVICES, LLC. (1179 KY orig.)
- `new-american-funding` — Broker Solutions, Inc. (1165 KY orig.)
- `silverton-mortgage-myrtle-beach` — VANDERBILT MORTGAGE AND FINANCE, INC. (1150 KY orig.)
- `pennymac` — PENNYMAC LOAN SERVICES, LLC (1132 KY orig.)
- `german-american-bank` — German American Bank (1097 KY orig.)
- `union-home-mortgage-reeves-team` — UNION HOME MORTGAGE CORP. (1069 KY orig.)

## Major markets (panel-ready)

- **Jefferson** (`21111`) — 19415 originations
- **Fayette** (`21067`) — 7013 originations
- **Kenton** (`21117`) — 5218 originations
- **Boone** (`21015`) — 4300 originations
- **Warren** (`21227`) — 3141 originations
- **Hardin** (`21093`) — 3136 originations
- **Campbell** (`21037`) — 2761 originations
- **Bullitt** (`21029`) — 2601 originations
- **Madison** (`21151`) — 2442 originations
- **Daviess** (`21059`) — 2345 originations
- **Oldham** (`21185`) — 2114 originations
- **Scott** (`21209`) — 2004 originations
- **Jessamine** (`21113`) — 1545 originations
- **Shelby** (`21211`) — 1407 originations
- **Christian** (`21047`) — 1363 originations
- **McCracken** (`21145`) — 1354 originations
- **Franklin** (`21073`) — 1353 originations
- **Nelson** (`21179`) — 1306 originations

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has state activity
- MO/KY curated: GLEIF-reidentified nationals + high-volume regionals (Flat Branch, Central Trust, CommunityAmerica, DAS Acquisition, Commerce Bank, Arvest, Stockton Mortgage, Community Trust Bank, Stock Yards, Commonwealth FCU, Republic Bank & Trust KY)
- Precision only — no low-confidence LEI inventing

## Rebuild

```bash
python scripts/build-hmda-mo-ky-slices.py
```

## Major slugs (for states.ts)

```
'jefferson', 'fayette', 'kenton', 'boone', 'warren', 'hardin', 'campbell', 'bullitt', 'madison', 'daviess', 'oldham', 'scott', 'jessamine', 'shelby', 'christian', 'mccracken', 'franklin', 'nelson'
```
