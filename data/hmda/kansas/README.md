# Kansas HMDA slice

**Source:** `data/hmda/by-state/KS/` (national 2025 foundation)

- County market rows: **16**
- Lender–county activity (major markets): **2767**
- LEI state summaries: **677**
- High-confidence LEI→directory mappings: **137**
- Major markets with names: **14**

## Top mapped LEIs by KS originations

- `rocket-mortgage` — Rocket Mortgage, LLC (3859 KS orig.)
- `communityamerica-federal-credit-union` — COMMUNITYAMERICA FEDERAL CREDIT UNION (2521 KS orig.)
- `fairway-mortgage-augusta-sheppard` — FAIRWAY INDEPENDENT MORTGAGE CORPORATION (1876 KS orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (1838 KS orig.)
- `capitol-federal-savings-bank` — Capitol Federal Savings Bank (1384 KS orig.)
- `veterans-united-west-valley` — MORTGAGE RESEARCH CENTER, LLC (1308 KS orig.)
- `pennymac` — PENNYMAC LOAN SERVICES, LLC (1217 KS orig.)
- `flat-branch-mortgage` — FLAT BRANCH MORTGAGE, INC. (1216 KS orig.)
- `guild-mortgage-metrowest` — GUILD MORTGAGE COMPANY LLC (1155 KS orig.)
- `credit-union-of-america` — CREDIT UNION OF AMERICA (1143 KS orig.)
- `meritrust-federal-credit-union` — MERITRUST Federal Credit Union (852 KS orig.)
- `fidelity-bank-kansas` — Fidelity Bank, National Association (805 KS orig.)
- `us-bank` — U.S. Bank National Association (772 KS orig.)
- `commerce-bank` — Commerce Bank (751 KS orig.)
- `arvest-bank` — Arvest Bank (735 KS orig.)
- `envista-federal-credit-union` — Envista Federal Credit Union (712 KS orig.)
- `freedom-mortgage` — FREEDOM MORTGAGE CORPORATION (697 KS orig.)
- `emprise-bank` — Emprise Bank (598 KS orig.)
- `mr-cooper` — NATIONSTAR MORTGAGE LLC (593 KS orig.)
- `guaranteed-rate` — Guaranteed Rate, Inc. (578 KS orig.)

## Major markets (panel-ready)

- **Johnson** (`20091`) — 15821 originations
- **Sedgwick** (`20173`) — 12454 originations
- **Shawnee** (`20177`) — 4060 originations
- **Wyandotte** (`20209`) — 3239 originations
- **Douglas** (`20045`) — 2242 originations
- **Leavenworth** (`20103`) — 2051 originations
- **Butler** (`20015`) — 1957 originations
- **Reno** (`20155`) — 1229 originations
- **Riley** (`20161`) — 1191 originations
- **Miami** (`20121`) — 918 originations
- **Geary** (`20061`) — 806 originations
- **Harvey** (`20079`) — 749 originations
- **Pottawatomie** (`20149`) — 628 originations
- **Saline** (`20169`) — 610 originations

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
'johnson', 'sedgwick', 'shawnee', 'wyandotte', 'douglas', 'leavenworth', 'butler', 'reno', 'riley', 'miami', 'geary', 'harvey', 'pottawatomie', 'saline'
```
