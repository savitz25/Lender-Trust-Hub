# District of Columbia HMDA slice

**Source:** `data/hmda/by-state/DC/` (national 2025 foundation)

**Geography note:** The District of Columbia is a single HMDA county-equivalent (FIPS `11001`). Product path: `/local-lenders/district-of-columbia/district-of-columbia`.

- County market rows: **1**
- Lender–county activity (major markets): **404**
- LEI state summaries: **402**
- High-confidence LEI→directory mappings: **98**
- Major markets with names: **1**

## Top mapped LEIs by DC originations

- `rocket-mortgage` — Rocket Mortgage, LLC (469 DC orig.)
- `first-savings-mortgage` — FIRST SAVINGS MORTGAGE CORPORATION (451 DC orig.)
- `jpmorgan-chase-bank` — JPMorgan Chase Bank, National Association (307 DC orig.)
- `navy-federal-jacksonville` — Navy Federal Credit Union (297 DC orig.)
- `citibank` — Citibank, National Association (281 DC orig.)
- `first-home-mortgage` — FIRST HOME MORTGAGE CORPORATION (280 DC orig.)
- `guaranteed-rate` — Guaranteed Rate, Inc. (249 DC orig.)
- `truist-bank` — Truist Bank (240 DC orig.)
- `bank-fund-staff-federal-credit-union` — Bank-Fund Staff Federal Credit Union (220 DC orig.)
- `pnc-bank` — PNC Bank, National Association (211 DC orig.)
- `prosperity-home-mortgage` — Prosperity Home Mortgage, LLC (210 DC orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (198 DC orig.)
- `mr-cooper` — Nationstar Mortgage LLC (182 DC orig.)
- `mt-bank` — Manufacturers and Traders Trust Company (172 DC orig.)
- `atlantic-coast-mortgage` — Atlantic Coast Mortgage, LLC (148 DC orig.)
- `wells-fargo-bank` — Wells Fargo Bank, National Association (130 DC orig.)
- `primelending-columbus` — PrimeLending, a PlainsCapital Company (124 DC orig.)
- `cardinal-financial` — Cardinal Financial Company, Limited Partnership (122 DC orig.)
- `td-bank` — TD Bank, National Association (110 DC orig.)
- `united-bank` — United Bank (110 DC orig.)

## Major markets (panel-ready)

- **District of Columbia** (`11001`) — 9223 originations

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has DE/DC activity
- DE/DC curated: Pike Creek Mortgage, Meridian Bank, Keystone Funding, Del-One FCU, K. Hovnanian American Mortgage, First Savings Mortgage, Bank-Fund Staff FCU, Dover FCU
- No fuzzy LEI inventing

## Rebuild

```bash
python scripts/build-hmda-de-dc-slices.py
```
