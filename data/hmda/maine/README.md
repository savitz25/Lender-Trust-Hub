# Maine HMDA slice

**Source:** `data/hmda/by-state/ME/` (national 2025 foundation)

- County market rows: **16**
- Lender–county activity (major counties): **2531**
- LEI state summaries: **455**
- High-confidence LEI→directory mappings: **86**
- Major counties with names: **16**

## Top mapped LEIs by ME originations

- `bangor-savings-bank` — Bangor Savings Bank (3199 ME orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (2077 ME orig.)
- `camden-national-bank` — The Camden National Bank (1794 ME orig.)
- `rocket-mortgage` — Rocket Mortgage, LLC (1775 ME orig.)
- `amerihome-mortgage` — AmeriHome Mortgage Company, LLC (1507 ME orig.)
- `ally-bank` — Ally Bank (1347 ME orig.)
- `td-bank` — TD Bank, National Association (699 ME orig.)
- `movement-mortgage-myrtle-beach` — Movement Mortgage, LLC (507 ME orig.)
- `freedom-mortgage` — Freedom Mortgage Corporation (398 ME orig.)
- `primelending-columbus` — PrimeLending, a PlainsCapital Company (390 ME orig.)
- `new-american-funding` — Broker Solutions, Inc. (387 ME orig.)
- `pennymac` — PennyMac Loan Services, LLC (353 ME orig.)
- `guild-mortgage-metrowest` — Guild Mortgage Company LLC (346 ME orig.)
- `northpoint-mortgage` — NORTHPOINT MORTGAGE, INC. (343 ME orig.)
- `fairway-mortgage-augusta-sheppard` — Fairway Independent Mortgage Corporation (339 ME orig.)
- `navy-federal-jacksonville` — Navy Federal Credit Union (314 ME orig.)
- `total-mortgage-services` — TOTAL MORTGAGE SERVICES, LLC (313 ME orig.)
- `mr-cooper` — NATIONSTAR MORTGAGE LLC (296 ME orig.)
- `guaranteed-rate` — Guaranteed Rate, Inc. (283 ME orig.)
- `mr-cooper` — Nationstar Mortgage LLC (277 ME orig.)

## Major counties (panel-ready)

- **Cumberland** (`23005`) — 8185 originations
- **York** (`23031`) — 6767 originations
- **Penobscot** (`23019`) — 3698 originations
- **Kennebec** (`23011`) — 3328 originations
- **Androscoggin** (`23001`) — 2556 originations
- **Oxford** (`23017`) — 1470 originations
- **Hancock** (`23009`) — 1430 originations
- **Somerset** (`23025`) — 1107 originations
- **Aroostook** (`23003`) — 1099 originations
- **Waldo** (`23027`) — 1084 originations
- **Knox** (`23013`) — 1046 originations
- **Lincoln** (`23015`) — 1036 originations
- **Sagadahoc** (`23023`) — 919 originations
- **Washington** (`23029`) — 632 originations
- **Franklin** (`23007`) — 618 originations
- **Piscataquis** (`23021`) — 466 originations

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has state activity
- NE curated: Washington Trust, BankNewport, PRMI, Bangor Savings, Camden National
- No fuzzy LEI inventing

## Rebuild

```bash
python scripts/build-hmda-ri-vt-me-slices.py
```
