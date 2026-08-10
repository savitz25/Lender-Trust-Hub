# Vermont HMDA slice

**Source:** `data/hmda/by-state/VT/` (national 2025 foundation)

- County market rows: **14**
- Lender–county activity (major counties): **1160**
- LEI state summaries: **278**
- High-confidence LEI→directory mappings: **75**
- Major counties with names: **12**

## Top mapped LEIs by VT originations

- `rocket-mortgage` — Rocket Mortgage, LLC (786 VT orig.)
- `emm-loans` — EMM LOANS LLC (644 VT orig.)
- `citizens-bank` — Citizens Bank, National Association (397 VT orig.)
- `mt-bank` — Manufacturers and Traders Trust Company (352 VT orig.)
- `amerihome-mortgage` — AmeriHome Mortgage Company, LLC (318 VT orig.)
- `td-bank` — TD Bank, National Association (207 VT orig.)
- `movement-mortgage-myrtle-beach` — Movement Mortgage, LLC (167 VT orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (166 VT orig.)
- `ally-bank` — Ally Bank (154 VT orig.)
- `primelending-columbus` — PrimeLending, a PlainsCapital Company (119 VT orig.)
- `better-mortgage` — BETTER MORTGAGE CORPORATION (117 VT orig.)
- `guild-mortgage-metrowest` — Guild Mortgage Company LLC (99 VT orig.)
- `navy-federal-jacksonville` — Navy Federal Credit Union (92 VT orig.)
- `guaranteed-rate` — Guaranteed Rate, Inc. (87 VT orig.)
- `newrez` — Newrez LLC (84 VT orig.)
- `fairway-mortgage-augusta-sheppard` — Fairway Independent Mortgage Corporation (83 VT orig.)
- `new-american-funding` — Broker Solutions, Inc. (81 VT orig.)
- `jpmorgan-chase-bank` — JPMorgan Chase Bank, National Association (80 VT orig.)
- `primelending-columbus` — PRIMELENDING, A PLAINSCAPITAL COMPANY (76 VT orig.)
- `pennymac` — PennyMac Loan Services, LLC (68 VT orig.)

## Major counties (panel-ready)

- **Chittenden** (`50007`) — 3576 originations
- **Washington** (`50023`) — 1382 originations
- **Franklin** (`50011`) — 1333 originations
- **Windsor** (`50027`) — 1322 originations
- **Rutland** (`50021`) — 983 originations
- **Windham** (`50025`) — 863 originations
- **Lamoille** (`50015`) — 666 originations
- **Addison** (`50001`) — 640 originations
- **Orleans** (`50019`) — 640 originations
- **Caledonia** (`50005`) — 594 originations
- **Orange** (`50017`) — 522 originations
- **Bennington** (`50003`) — 519 originations

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has state activity
- NE curated: Washington Trust, BankNewport, PRMI, Bangor Savings, Camden National
- No fuzzy LEI inventing

## Rebuild

```bash
python scripts/build-hmda-ri-vt-me-slices.py
```
