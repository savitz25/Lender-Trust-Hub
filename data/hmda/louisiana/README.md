# Louisiana HMDA slice

**Source:** `data/hmda/by-state/LA/` (national 2025 foundation)

- County/parish market rows: **27**
- Lender–parishe activity (major markets): **3606**
- LEI state summaries: **605**
- High-confidence LEI→directory mappings: **124**
- Major markets with names: **18**

## Top mapped LEIs by LA originations

- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (4514 LA orig.)
- `rocket-mortgage` — Rocket Mortgage, LLC (3674 LA orig.)
- `hancock-whitney-bank` — HANCOCK WHITNEY BANK (2258 LA orig.)
- `gmfs-mortgage` — GMFS LLC (2035 LA orig.)
- `dsld-mortgage` — DSLD MORTGAGE, LLC (1879 LA orig.)
- `fidelity-bank-louisiana` — FIDELITY BANK (1369 LA orig.)
- `first-horizon-bank` — First Horizon Bank (1305 LA orig.)
- `assurance-financial` — ASSURANCE FINANCIAL GROUP, L.L.C. (1298 LA orig.)
- `eustis-mortgage` — EUSTIS MORTGAGE CORPORATION (1292 LA orig.)
- `regions-bank` — Regions Bank (1282 LA orig.)
- `movement-mortgage-myrtle-beach` — MOVEMENT MORTGAGE, LLC (1248 LA orig.)
- `jpmorgan-chase-bank` — JPMorgan Chase Bank, National Association (1188 LA orig.)
- `21st-mortgage` — 21ST MORTGAGE CORPORATION (1097 LA orig.)
- `veterans-united-west-valley` — MORTGAGE RESEARCH CENTER, LLC (1090 LA orig.)
- `freedom-mortgage` — FREEDOM MORTGAGE CORPORATION (1040 LA orig.)
- `newrez` — Newrez LLC (1007 LA orig.)
- `pennymac` — PENNYMAC LOAN SERVICES, LLC (990 LA orig.)
- `dhi-mortgage-buckeye` — DHI MORTGAGE COMPANY, LTD. (973 LA orig.)
- `navy-federal-jacksonville` — Navy Federal Credit Union (860 LA orig.)
- `cadence-bank` — Cadence Bank (730 LA orig.)
- `loandepot` — LOANDEPOT.COM, LLC (728 LA orig.)
- `crosscountry-mortgage-metrowest` — CROSSCOUNTRY MORTGAGE, LLC (592 LA orig.)
- `planet-home-lending` — PLANET HOME LENDING, LLC (585 LA orig.)
- `mr-cooper` — NATIONSTAR MORTGAGE LLC (571 LA orig.)
- `guild-mortgage-metrowest` — GUILD MORTGAGE COMPANY LLC (561 LA orig.)

## Major markets (panel-ready parishes)

- **East Baton Rouge** (`22033`) — 7085 originations
- **St. Tammany** (`22103`) — 5654 originations
- **Jefferson** (`22051`) — 5203 originations
- **Lafayette** (`22055`) — 4836 originations
- **Orleans** (`22071`) — 4670 originations
- **Caddo** (`22017`) — 3415 originations
- **Livingston** (`22063`) — 3108 originations
- **Calcasieu** (`22019`) — 2826 originations
- **Ascension** (`22005`) — 2679 originations
- **Bossier** (`22015`) — 2666 originations
- **Ouachita** (`22073`) — 2570 originations
- **Tangipahoa** (`22105`) — 2274 originations
- **Rapides** (`22079`) — 1943 originations
- **Terrebonne** (`22109`) — 1314 originations
- **Lafourche** (`22057`) — 1292 originations
- **St. Landry** (`22097`) — 1013 originations
- **St. Charles** (`22089`) — 853 originations
- **Vermilion** (`22113`) — 782 originations

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has activity in this state
- AL curated: Redstone FCU, Trustmark, America's First FCU, Renasant, River Bank & Trust, MAX CU, ServisFirst
- LA curated: Hancock Whitney, GMFS, DSLD Mortgage, Eustis, Assurance Financial, Fidelity Bank (LA), EFCU Financial
- National LEI re-identify for UWM, Rocket, Regions, Guild, CrossCountry, Freedom, etc.
- Precision over coverage — no fuzzy LEI inventing

## Rebuild

```bash
python scripts/build-hmda-al-la-slices.py
```

## Major slugs (for states.ts)

```
'east-baton-rouge', 'st-tammany', 'jefferson', 'lafayette', 'orleans', 'caddo', 'livingston', 'calcasieu', 'ascension', 'bossier', 'ouachita', 'tangipahoa', 'rapides', 'terrebonne', 'lafourche', 'st-landry', 'st-charles', 'vermilion'
```
