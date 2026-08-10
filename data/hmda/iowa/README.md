# Iowa HMDA slice

**Source:** `data/hmda/by-state/IA/` (national 2025 foundation)

- County market rows: **22**
- Lender–county activity (major markets): **2434**
- LEI state summaries: **645**
- High-confidence LEI→directory mappings: **132**
- Major markets with names: **15**

## Top mapped LEIs by IA originations

- `greenstate-credit-union` — GREENSTATE Credit Union (10661 IA orig.)
- `veridian-credit-union` — VERIDIAN CREDIT UNION (6247 IA orig.)
- `hills-bank-and-trust` — Hills Bank and Trust Company (2874 IA orig.)
- `rocket-mortgage` — Rocket Mortgage, LLC (2551 IA orig.)
- `dupaco-community-credit-union` — DUPACO COMMUNITY (1990 IA orig.)
- `iowa-bankers-mortgage` — IOWA BANKERS MORTGAGE CORPORATION (1849 IA orig.)
- `community-choice-credit-union` — Community Choice Credit Union (1760 IA orig.)
- `northwest-bank-iowa` — Northwest Bank (1743 IA orig.)
- `us-bank` — U.S. Bank National Association (1593 IA orig.)
- `new-american-funding` — Broker Solutions, Inc. (1432 IA orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (1391 IA orig.)
- `midwestone-bank` — MidWestOne Bank (1090 IA orig.)
- `veterans-united-west-valley` — MORTGAGE RESEARCH CENTER, LLC (957 IA orig.)
- `dhi-mortgage-buckeye` — DHI MORTGAGE COMPANY, LTD. (671 IA orig.)
- `guaranteed-rate` — GUARANTEED RATE, INC. (654 IA orig.)
- `pennymac` — PENNYMAC LOAN SERVICES, LLC (631 IA orig.)
- `guild-mortgage-metrowest` — GUILD MORTGAGE COMPANY LLC (550 IA orig.)
- `wells-fargo-bank` — Wells Fargo Bank, National Association (526 IA orig.)
- `amerihome-mortgage` — AmeriHome Mortgage Company, LLC (489 IA orig.)
- `lower` — LOWER, LLC (486 IA orig.)

## Major markets (panel-ready)

- **Polk** (`19153`) — 13859 originations
- **Linn** (`19113`) — 6849 originations
- **Scott** (`19163`) — 4496 originations
- **Johnson** (`19103`) — 4374 originations
- **Dallas** (`19049`) — 3942 originations
- **Black Hawk** (`19013`) — 3796 originations
- **Dubuque** (`19061`) — 2695 originations
- **Pottawattamie** (`19155`) — 2568 originations
- **Woodbury** (`19193`) — 2082 originations
- **Warren** (`19181`) — 1920 originations
- **Story** (`19169`) — 1680 originations
- **Jasper** (`19099`) — 1030 originations
- **Clinton** (`19045`) — 811 originations
- **Muscatine** (`19139`) — 802 originations
- **Bremer** (`19017`) — 794 originations

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has state activity
- IA/KS/NE curated: GLEIF-reidentified nationals + Plains regionals (GreenState, Veridian, Hills Bank, Dupaco, Capitol Federal, CUA, Meritrust, Pinnacle Bank NE, FNBO, West Gate, Union Bank & Trust, Centris, etc.)
- Precision only — no low-confidence LEI inventing

## Rebuild

```bash
python scripts/build-hmda-ia-ks-ne-slices.py
```

## Major slugs (for states.ts)

```
'polk', 'linn', 'scott', 'johnson', 'dallas', 'black-hawk', 'dubuque', 'pottawattamie', 'woodbury', 'warren', 'story', 'jasper', 'clinton', 'muscatine', 'bremer'
```
