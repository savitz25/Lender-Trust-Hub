# Alabama HMDA slice

**Source:** `data/hmda/by-state/AL/` (national 2025 foundation)

- County/parish market rows: **30**
- Lender–countie activity (major markets): **5360**
- LEI state summaries: **885**
- High-confidence LEI→directory mappings: **170**
- Major markets with names: **20**

## Top mapped LEIs by AL originations

- `rocket-mortgage` — Rocket Mortgage, LLC (6770 AL orig.)
- `regions-bank` — Regions Bank (5523 AL orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (5482 AL orig.)
- `redstone-federal-credit-union` — REDSTONE FEDERAL CREDIT UNION (2768 AL orig.)
- `trustmark-bank` — Trustmark Bank (2645 AL orig.)
- `veterans-united-west-valley` — MORTGAGE RESEARCH CENTER, LLC (2471 AL orig.)
- `dhi-mortgage-buckeye` — DHI MORTGAGE COMPANY, LTD. (2376 AL orig.)
- `renasant-bank` — Renasant Bank (1966 AL orig.)
- `fairway-mortgage-augusta-sheppard` — FAIRWAY INDEPENDENT MORTGAGE CORPORATION (1902 AL orig.)
- `guild-mortgage-metrowest` — GUILD MORTGAGE COMPANY LLC (1892 AL orig.)
- `pennymac` — PENNYMAC LOAN SERVICES, LLC (1791 AL orig.)
- `cadence-bank` — Cadence Bank (1759 AL orig.)
- `firstbank-tennessee` — FirstBank (1712 AL orig.)
- `freedom-mortgage` — FREEDOM MORTGAGE CORPORATION (1669 AL orig.)
- `movement-mortgage-myrtle-beach` — MOVEMENT MORTGAGE, LLC (1644 AL orig.)
- `navy-federal-jacksonville` — Navy Federal Credit Union (1525 AL orig.)
- `americas-first-federal-credit-union` — AMERICA'S FIRST (1508 AL orig.)
- `silverton-mortgage-myrtle-beach` — VANDERBILT MORTGAGE AND FINANCE, INC. (1426 AL orig.)
- `river-bank-and-trust` — River Bank & Trust (1377 AL orig.)
- `pnc-bank` — PNC Bank, National Association (1357 AL orig.)
- `loandepot` — LOANDEPOT.COM, LLC (1346 AL orig.)
- `21st-mortgage` — 21ST MORTGAGE CORPORATION (1274 AL orig.)
- `crosscountry-mortgage-metrowest` — CROSSCOUNTRY MORTGAGE, LLC (1093 AL orig.)
- `synovus-bank` — Synovus Bank (1016 AL orig.)
- `union-home-mortgage-reeves-team` — UNION HOME MORTGAGE CORP. (1014 AL orig.)

## Major markets (panel-ready counties)

- **Jefferson** (`01073`) — 14241 originations
- **Madison** (`01089`) — 12301 originations
- **Baldwin** (`01003`) — 8842 originations
- **Mobile** (`01097`) — 7860 originations
- **Shelby** (`01117`) — 6757 originations
- **Lee** (`01081`) — 4653 originations
- **Tuscaloosa** (`01125`) — 4403 originations
- **Montgomery** (`01101`) — 4341 originations
- **Limestone** (`01083`) — 4075 originations
- **Morgan** (`01103`) — 2896 originations
- **St. Clair** (`01115`) — 2689 originations
- **Houston** (`01069`) — 2524 originations
- **Elmore** (`01051`) — 2503 originations
- **Lauderdale** (`01077`) — 2433 originations
- **Marshall** (`01095`) — 2206 originations
- **Calhoun** (`01015`) — 2149 originations
- **Etowah** (`01055`) — 2050 originations
- **Cullman** (`01043`) — 2033 originations
- **Autauga** (`01001`) — 1612 originations
- **Coffee** (`01031`) — 1551 originations

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
'jefferson', 'madison', 'baldwin', 'mobile', 'shelby', 'lee', 'tuscaloosa', 'montgomery', 'limestone', 'morgan', 'st-clair', 'houston', 'elmore', 'lauderdale', 'marshall', 'calhoun', 'etowah', 'cullman', 'autauga', 'coffee'
```
