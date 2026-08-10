# Rhode Island HMDA slice

**Source:** `data/hmda/by-state/RI/` (national 2025 foundation)

- County market rows: **5**
- Lender–county activity (major counties): **1111**
- LEI state summaries: **385**
- High-confidence LEI→directory mappings: **85**
- Major counties with names: **5**

## Top mapped LEIs by RI originations

- `citizens-bank` — Citizens Bank, National Association (3762 RI orig.)
- `washington-trust-mortgage` — The Washington Trust Company, of Westerly (1040 RI orig.)
- `rocket-mortgage` — Rocket Mortgage, LLC (1016 RI orig.)
- `cardinal-financial` — Cardinal Financial Company, Limited Partnership (1001 RI orig.)
- `primary-residential-mortgage` — PRIMARY RESIDENTIAL MORTGAGE, INC. (690 RI orig.)
- `banknewport` — BankNewport (656 RI orig.)
- `amerihome-mortgage` — AmeriHome Mortgage Company, LLC (587 RI orig.)
- `ally-bank` — Ally Bank (556 RI orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (531 RI orig.)
- `nfm-lending` — NFM, INC. (459 RI orig.)
- `guaranteed-rate` — Guaranteed Rate, Inc. (432 RI orig.)
- `baycoast-mortgage` — BAYCOAST MORTGAGE COMPANY, LLC (429 RI orig.)
- `pennymac` — PennyMac Loan Services, LLC (410 RI orig.)
- `anniemac-home-mortgage` — AMERICAN NEIGHBORHOOD MORTGAGE ACCEPTANCE COMPANY LLC (334 RI orig.)
- `navy-federal-jacksonville` — Navy Federal Credit Union (294 RI orig.)
- `fairway-mortgage-augusta-sheppard` — Fairway Independent Mortgage Corporation (260 RI orig.)
- `newrez` — Newrez LLC (250 RI orig.)
- `mr-cooper` — Nationstar Mortgage LLC (250 RI orig.)
- `guild-mortgage-metrowest` — Guild Mortgage Company LLC (211 RI orig.)
- `freedom-mortgage` — Freedom Mortgage Corporation (206 RI orig.)

## Major counties (panel-ready)

- **Providence** (`44007`) — 14086 originations
- **Kent** (`44003`) — 5142 originations
- **Washington** (`44009`) — 3529 originations
- **Newport** (`44005`) — 2024 originations
- **Bristol** (`44001`) — 1203 originations

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has state activity
- NE curated: Washington Trust, BankNewport, PRMI, Bangor Savings, Camden National
- No fuzzy LEI inventing

## Rebuild

```bash
python scripts/build-hmda-ri-vt-me-slices.py
```
