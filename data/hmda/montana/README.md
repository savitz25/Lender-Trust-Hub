# Montana HMDA slice

**Source:** `data/hmda/by-state/MT/` (national 2025 foundation)

- County market rows: **10**
- Lender–county activity (major markets): **1540**
- LEI state summaries: **482**
- High-confidence LEI→directory mappings: **138**
- Major markets with names: **10**

## Top mapped LEIs by MT originations

- `stockman-bank-of-montana` — Stockman Bank of Montana (2183 MT orig.)
- `glacier-bank` — Glacier Bank (1904 MT orig.)
- `rocket-mortgage` — Rocket Mortgage, LLC (1465 MT orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (1414 MT orig.)
- `opportunity-bank-of-montana` — OPPORTUNITY BANK OF MONTANA (1139 MT orig.)
- `evergreen-moneysource-mortgage` — EVERGREEN MONEYSOURCE MORTGAGE COMPANY (816 MT orig.)
- `crosscountry-mortgage-metrowest` — CROSSCOUNTRY MORTGAGE, LLC (640 MT orig.)
- `first-interstate-bank` — First Interstate Bank (610 MT orig.)
- `guild-mortgage-metrowest` — GUILD MORTGAGE COMPANY LLC (547 MT orig.)
- `us-bank` — U.S. Bank National Association (538 MT orig.)
- `guaranteed-rate` — GUARANTEED RATE, INC. (462 MT orig.)
- `veterans-united-west-valley` — MORTGAGE RESEARCH CENTER, LLC (439 MT orig.)
- `pennymac` — PENNYMAC LOAN SERVICES, LLC (364 MT orig.)
- `altana-federal-credit-union` — Altana Federal Credit Union (356 MT orig.)
- `freedom-mortgage` — FREEDOM MORTGAGE CORPORATION (331 MT orig.)
- `kind-lending` — KIND LENDING, LLC (319 MT orig.)
- `lower` — LOWER, LLC (221 MT orig.)
- `mr-cooper` — NATIONSTAR MORTGAGE LLC (217 MT orig.)
- `loandepot` — LOANDEPOT.COM, LLC (215 MT orig.)
- `fairway-mortgage-augusta-sheppard` — FAIRWAY INDEPENDENT MORTGAGE CORPORATION (207 MT orig.)

## Major markets (panel-ready)

- **Yellowstone** (`30111`) — 4235 originations
- **Gallatin** (`30031`) — 2618 originations
- **Flathead** (`30029`) — 2585 originations
- **Missoula** (`30063`) — 2243 originations
- **Cascade** (`30013`) — 1989 originations
- **Lewis and Clark** (`30049`) — 1789 originations
- **Ravalli** (`30081`) — 872 originations
- **Silver Bow** (`30093`) — 808 originations
- **Lake** (`30047`) — 509 originations
- **Lincoln** (`30053`) — 452 originations

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has state activity
- ID/MT/WY curated: GLEIF-reidentified nationals + Mountain West regionals (Idaho Central CU, Glacier Bank, First Interstate, Stockman Bank, Opportunity Bank of Montana, Jonah Bank, UniWyo FCU, etc.)
- Precision only — no low-confidence LEI inventing

## Rebuild

```bash
python scripts/build-hmda-id-mt-wy-slices.py
```

## Major slugs (for states.ts)

```
'yellowstone', 'gallatin', 'flathead', 'missoula', 'cascade', 'lewis-and-clark', 'ravalli', 'silver-bow', 'lake', 'lincoln'
```
