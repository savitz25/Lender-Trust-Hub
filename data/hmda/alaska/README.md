# Alaska HMDA slice

**Source:** `data/hmda/by-state/AK/` (national 2025 foundation)

- Market rows: **17**
- Lender–market activity (major markets): **706**
- LEI state summaries: **195**
- High-confidence LEI→directory mappings: **70**
- Major markets with names: **12**

## Top mapped LEIs by AK originations

- `global-federal-credit-union` — Global Federal Credit Union (1678 AK orig.)
- `residential-mortgage-alaska` — RESIDENTIAL MORTGAGE, LLC (1445 AK orig.)
- `newrez` — Newrez LLC (973 AK orig.)
- `rocket-mortgage` — Rocket Mortgage, LLC (776 AK orig.)
- `veterans-united-west-valley` — MORTGAGE RESEARCH CENTER, LLC (446 AK orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (399 AK orig.)
- `cmg-home-loans-dennis-vo` — CMG Mortgage, Inc. (380 AK orig.)
- `credit-union-1-alaska` — CREDIT UNION 1 Credit Union (278 AK orig.)
- `primelending-columbus` — PRIMELENDING, A PLAINSCAPITAL COMPANY (238 AK orig.)
- `movement-mortgage-myrtle-beach` — MOVEMENT MORTGAGE, LLC (229 AK orig.)
- `loandepot` — LOANDEPOT.COM, LLC (213 AK orig.)
- `first-national-bank-alaska` — First National Bank Alaska (203 AK orig.)
- `guild-mortgage-metrowest` — GUILD MORTGAGE COMPANY LLC (197 AK orig.)
- `freedom-mortgage` — FREEDOM MORTGAGE CORPORATION (170 AK orig.)
- `navy-federal-jacksonville` — Navy Federal Credit Union (168 AK orig.)
- `pennymac` — PENNYMAC LOAN SERVICES, LLC (146 AK orig.)
- `mt-mckinley-bank` — Mt. McKinley Bank (143 AK orig.)
- `guaranteed-rate` — GUARANTEED RATE, INC. (138 AK orig.)
- `wells-fargo-bank` — Wells Fargo Bank, National Association (116 AK orig.)
- `mr-cooper` — NATIONSTAR MORTGAGE LLC (95 AK orig.)

## Major markets (panel-ready)

- **Anchorage** (`02020`) — 4887 originations
- **Matanuska-Susitna** (`02170`) — 2956 originations
- **Fairbanks North Star** (`02090`) — 1635 originations
- **Kenai Peninsula** (`02122`) — 1101 originations
- **Juneau** (`02110`) — 491 originations
- **Ketchikan Gateway** (`02130`) — 138 originations
- **Kodiak Island** (`02150`) — 137 originations
- **Southeast Fairbanks** (`02240`) — 122 originations
- **Chugach** (`02063`) — 79 originations
- **Sitka** (`02220`) — 59 originations
- **Nome** (`02180`) — 47 originations
- **Bethel** (`02050`) — 41 originations

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has activity in this state
- AK: Global FCU, Residential Mortgage LLC, First National Bank Alaska, Credit Union 1, Mt. McKinley Bank
- HI: Bank of Hawaii, First Hawaiian, American Savings Bank, Hawaii State FCU, HawaiiUSA, Central Pacific Bank
- ND: Gate City Bank, First International Bank & Trust, First Community CU, Dacotah Bank, Bravera Bank
- SD: Plains Commerce Bank, First PREMIER, Black Hills FCU, First Dakota, First Bank & Trust, Levo FCU, BankWest
- Precision over coverage — no fuzzy LEI inventing

## Rebuild

```bash
python scripts/build-hmda-final4-slices.py
```

## Major slugs (for states.ts)

```
'anchorage', 'matanuska-susitna', 'fairbanks-north-star', 'kenai-peninsula', 'juneau', 'ketchikan-gateway', 'kodiak-island', 'southeast-fairbanks', 'chugach', 'sitka', 'nome', 'bethel'
```
