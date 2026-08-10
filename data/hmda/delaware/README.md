# Delaware HMDA slice

**Source:** `data/hmda/by-state/DE/` (national 2025 foundation)

- County market rows: **3**
- Lender–county activity (major markets): **1012**
- LEI state summaries: **473**
- High-confidence LEI→directory mappings: **112**
- Major markets with names: **3**

## Top mapped LEIs by DE originations

- `rocket-mortgage` — Rocket Mortgage, LLC (1788 DE orig.)
- `wsfs-bank` — Wilmington Savings Fund Society, FSB (1210 DE orig.)
- `pike-creek-mortgage` — PIKE CREEK MORTGAGE SERVICES, INC. (1176 DE orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (1017 DE orig.)
- `nvr-mortgage` — NVR Mortgage Finance, Inc. (1001 DE orig.)
- `citizens-bank` — Citizens Bank, National Association (972 DE orig.)
- `pnc-bank` — PNC Bank, National Association (867 DE orig.)
- `mt-bank` — Manufacturers and Traders Trust Company (767 DE orig.)
- `meridian-bank` — MERIDIAN BANK (640 DE orig.)
- `pennymac` — PennyMac Loan Services, LLC (569 DE orig.)
- `keystone-funding` — KEYSTONE FUNDING, INC. (564 DE orig.)
- `ally-bank` — Ally Bank (546 DE orig.)
- `del-one-federal-credit-union` — DEL-ONE FEDERAL CREDIT UNION (486 DE orig.)
- `fairway-mortgage-augusta-sheppard` — Fairway Independent Mortgage Corporation (483 DE orig.)
- `loandepot` — loanDepot.com, LLC (449 DE orig.)
- `freedom-mortgage` — Freedom Mortgage Corporation (408 DE orig.)
- `prosperity-home-mortgage` — Prosperity Home Mortgage, LLC (383 DE orig.)
- `k-hovnanian-american-mortgage` — K. HOVNANIAN AMERICAN MORTGAGE, L.L.C. (364 DE orig.)
- `navy-federal-jacksonville` — Navy Federal Credit Union (344 DE orig.)
- `newrez` — Newrez LLC (344 DE orig.)

## Major markets (panel-ready)

- **New Castle** (`10003`) — 12723 originations
- **Sussex** (`10005`) — 9159 originations
- **Kent** (`10001`) — 5023 originations

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has DE/DC activity
- DE/DC curated: Pike Creek Mortgage, Meridian Bank, Keystone Funding, Del-One FCU, K. Hovnanian American Mortgage, First Savings Mortgage, Bank-Fund Staff FCU, Dover FCU
- No fuzzy LEI inventing

## Rebuild

```bash
python scripts/build-hmda-de-dc-slices.py
```
