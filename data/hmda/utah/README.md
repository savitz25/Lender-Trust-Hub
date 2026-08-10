# Utah HMDA slice

**Source:** `data/hmda/by-state/UT/` (national 2025 foundation)

- County market rows: **29**
- Lender–county activity (major markets): **2932**
- LEI state summaries: **499**
- High-confidence LEI→directory mappings: **125**
- Major markets with names: **16**

## Top mapped LEIs by UT originations

- `america-first-federal-credit-union` — AMERICA FIRST Federal Credit Union (11759 UT orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (8957 UT orig.)
- `mountain-america-federal-credit-union` — Mountain America Federal Credit Union (7223 UT orig.)
- `rocket-mortgage` — Rocket Mortgage, LLC (4780 UT orig.)
- `guild-mortgage-metrowest` — GUILD MORTGAGE COMPANY LLC (3981 UT orig.)
- `intercap-lending` — INTERCAP LENDING INC. (3672 UT orig.)
- `goldenwest-federal-credit-union` — GOLDENWEST (3013 UT orig.)
- `first-colony-mortgage` — FIRST COLONY MORTGAGE CORPORATION (2983 UT orig.)
- `kind-lending` — KIND LENDING, LLC (2249 UT orig.)
- `cmg-home-loans-dennis-vo` — CMG Mortgage, Inc. (1917 UT orig.)
- `zions-bank` — Zions Bancorporation, N.A. (1755 UT orig.)
- `securitynational-mortgage` — SECURITYNATIONAL MORTGAGE COMPANY (1700 UT orig.)
- `utah-community-credit-union` — UTAH COMMUNITY FEDERAL CREDIT UNION (1549 UT orig.)
- `pennymac` — PENNYMAC LOAN SERVICES, LLC (1214 UT orig.)
- `dhi-mortgage-buckeye` — DHI MORTGAGE COMPANY, LTD. (1170 UT orig.)
- `utah-first-credit-union` — UTAH FIRST (994 UT orig.)
- `fairway-mortgage-augusta-sheppard` — FAIRWAY INDEPENDENT MORTGAGE CORPORATION (934 UT orig.)
- `mr-cooper` — NATIONSTAR MORTGAGE LLC (914 UT orig.)
- `loandepot` — LOANDEPOT.COM, LLC (778 UT orig.)
- `deseret-first-credit-union` — Deseret First Credit Union (775 UT orig.)
- `crosscountry-mortgage-metrowest` — CROSSCOUNTRY MORTGAGE, LLC (745 UT orig.)
- `freedom-mortgage` — FREEDOM MORTGAGE CORPORATION (726 UT orig.)
- `us-bank` — U.S. Bank National Association (726 UT orig.)
- `ranlife` — RANLIFE, INC. (712 UT orig.)
- `bank-of-utah` — BANK OF UTAH (696 UT orig.)

## Major markets (panel-ready)

- **Salt Lake** (`49035`) — 28617 originations
- **Utah** (`49049`) — 20129 originations
- **Davis** (`49011`) — 10402 originations
- **Weber** (`49057`) — 9067 originations
- **Washington** (`49053`) — 7264 originations
- **Cache** (`49005`) — 3342 originations
- **Tooele** (`49045`) — 3203 originations
- **Iron** (`49021`) — 2096 originations
- **Box Elder** (`49003`) — 2061 originations
- **Wasatch** (`49051`) — 1755 originations
- **Summit** (`49043`) — 1710 originations
- **Uintah** (`49047`) — 1046 originations
- **Sanpete** (`49039`) — 743 originations
- **Sevier** (`49041`) — 641 originations
- **Carbon** (`49007`) — 588 originations
- **Morgan** (`49029`) — 481 originations

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has activity in this state
- UT/NV curated: America First FCU, Mountain America FCU, Intercap, Goldenwest, First Colony, SecurityNational, Utah Community CU, RanLife, Bank of Utah, Deseret First, Utah First, Chartway, Security Home Mortgage, Provident Funding, Greater Nevada CU, plus Academy / PRMI / Zions directory reuse
- Precision over coverage — no fuzzy LEI inventing

## Rebuild

```bash
python scripts/build-hmda-ut-nv-slices.py
```

## Major slugs (for states.ts)

```
'salt-lake', 'utah', 'davis', 'weber', 'washington', 'cache', 'tooele', 'iron', 'box-elder', 'wasatch', 'summit', 'uintah', 'sanpete', 'sevier', 'carbon', 'morgan'
```
