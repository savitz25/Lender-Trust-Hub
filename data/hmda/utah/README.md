# Utah HMDA slice (deepened)

**Source:** `data/hmda/by-state/UT/` (national foundation)

**Phase:** utah-deepen

- County market rows: **26**
- Lender–county activity (major markets): **3556**
- LEI state summaries: **499**
- High-confidence LEI→directory mappings: **156**
- Major markets with names: **26**
- Top-20 mapped: **20/20** · Top-50 mapped: **46/50**

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
- `my-move-mortgage` — MY MOVE MORTGAGE, LLC (1140 UT orig.)
- `cyprus-credit-union` — CYPRUS Federal Credit Union (1104 UT orig.)
- `utah-first-credit-union` — UTAH FIRST (994 UT orig.)
- `canyon-view-credit-union` — CANYON VIEW (978 UT orig.)
- `fairway-mortgage-augusta-sheppard` — FAIRWAY INDEPENDENT MORTGAGE CORPORATION (934 UT orig.)
- `plains-commerce-bank` — Plains Commerce Bank (934 UT orig.)
- `mr-cooper` — NATIONSTAR MORTGAGE LLC (914 UT orig.)
- `loandepot` — LOANDEPOT.COM, LLC (778 UT orig.)
- `deseret-first-credit-union` — Deseret First Credit Union (775 UT orig.)
- `crosscountry-mortgage-metrowest` — CROSSCOUNTRY MORTGAGE, LLC (745 UT orig.)
- `freedom-mortgage` — FREEDOM MORTGAGE CORPORATION (726 UT orig.)
- `us-bank` — U.S. Bank National Association (726 UT orig.)
- `ranlife` — RANLIFE, INC. (712 UT orig.)
- `bank-of-utah` — BANK OF UTAH (696 UT orig.)
- `newrez` — Newrez LLC (687 UT orig.)

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
- **Duchesne** (`49013`) — 470 originations
- **Kane** (`49025`) — 392 originations
- **Juab** (`49023`) — 385 originations
- **Millard** (`49027`) — 345 originations
- **Emery** (`49015`) — 216 originations
- **Beaver** (`49001`) — 181 originations
- **Rich** (`49033`) — 178 originations
- **Grand** (`49019`) — 172 originations
- **Garfield** (`49017`) — 171 originations
- **San Juan** (`49037`) — 146 originations

## Matching rules

- Reuse prior product-state curated LEI maps when LEI has UT activity
- **ut_deepen** GLEIF re-identification + UT directory hosts
- Precision over coverage — low-confidence regionals deferred

## Rebuild

```bash
python scripts/build-hmda-utah-deepen.py
```
