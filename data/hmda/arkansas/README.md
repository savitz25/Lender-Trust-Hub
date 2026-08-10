# Arkansas HMDA slice

**Source:** `data/hmda/by-state/AR/` (national 2025 foundation)

- County market rows: **19**
- Lender–county activity (major markets): **3476**
- LEI state summaries: **674**
- High-confidence LEI→directory mappings: **147**
- Major markets with names: **18**

## Top mapped LEIs by AR originations

- `arvest-bank` — Arvest Bank (6555 AR orig.)
- `rocket-mortgage` — Rocket Mortgage, LLC (4094 AR orig.)
- `arkansas-federal-credit-union` — ARKANSAS FEDERAL CREDIT UNION (2249 AR orig.)
- `firsttrust-home-loans` — FIRSTTRUST HOME LOANS, INC. (2197 AR orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (1696 AR orig.)
- `first-security-bank-arkansas` — First Security Bank (1534 AR orig.)
- `flat-branch-mortgage` — FLAT BRANCH MORTGAGE, INC. (1481 AR orig.)
- `fairway-mortgage-augusta-sheppard` — FAIRWAY INDEPENDENT MORTGAGE CORPORATION (1335 AR orig.)
- `centennial-bank` — Centennial Bank (1278 AR orig.)
- `veterans-united-west-valley` — MORTGAGE RESEARCH CENTER, LLC (1236 AR orig.)
- `regions-bank` — Regions Bank (1129 AR orig.)
- `bank-ozk` — Bank OZK (1001 AR orig.)
- `simmons-bank` — Simmons Bank (986 AR orig.)
- `pennymac` — PENNYMAC LOAN SERVICES, LLC (947 AR orig.)
- `cadence-bank` — Cadence Bank (939 AR orig.)
- `freedom-mortgage` — FREEDOM MORTGAGE CORPORATION (675 AR orig.)
- `dhi-mortgage-buckeye` — DHI MORTGAGE COMPANY, LTD. (638 AR orig.)
- `21st-mortgage` — 21ST MORTGAGE CORPORATION (631 AR orig.)
- `first-horizon-bank` — First Horizon Bank (628 AR orig.)
- `us-bank` — U.S. Bank National Association (556 AR orig.)

## Major markets (panel-ready)

- **Benton** (`05007`) — 10606 originations
- **Pulaski** (`05119`) — 8510 originations
- **Washington** (`05143`) — 6214 originations
- **Saline** (`05125`) — 3566 originations
- **Faulkner** (`05045`) — 3325 originations
- **Craighead** (`05031`) — 2594 originations
- **Sebastian** (`05131`) — 2567 originations
- **Garland** (`05051`) — 2357 originations
- **Lonoke** (`05085`) — 2201 originations
- **White** (`05145`) — 1733 originations
- **Crawford** (`05033`) — 1339 originations
- **Pope** (`05115`) — 1191 originations
- **Baxter** (`05005`) — 1107 originations
- **Greene** (`05055`) — 1072 originations
- **Boone** (`05009`) — 944 originations
- **Jefferson** (`05069`) — 813 originations
- **Crittenden** (`05035`) — 787 originations
- **Independence** (`05063`) — 704 originations

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has activity in this state
- AR curated: Arvest, Arkansas FCU, FirstTrust, First Security Bank, Centennial, Bank OZK, Simmons
- MS curated: Community Bank of Mississippi, BankPlus (+ Trustmark / Cadence / Renasant reuse)
- OK curated: BancFirst, MidFirst, TTCU, First United (+ BOK / Gateway / Arvest reuse)
- National LEI re-identify for UWM, Rocket, Regions, Guild, Freedom, etc.
- Precision over coverage — no fuzzy LEI inventing

## Rebuild

```bash
python scripts/build-hmda-ar-ms-ok-slices.py
```

## Major slugs (for states.ts)

```
'benton', 'pulaski', 'washington', 'saline', 'faulkner', 'craighead', 'sebastian', 'garland', 'lonoke', 'white', 'crawford', 'pope', 'baxter', 'greene', 'boone', 'jefferson', 'crittenden', 'independence'
```
