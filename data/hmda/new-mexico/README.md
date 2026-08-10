# New Mexico HMDA slice

**Source:** `data/hmda/by-state/NM/` (national 2025 foundation)

- County market rows: **18**
- Lender–county activity (major markets): **2556**
- LEI state summaries: **513**
- High-confidence LEI→directory mappings: **146**
- Major markets with names: **18**

## Top mapped LEIs by NM originations

- `rocket-mortgage` — Rocket Mortgage, LLC (2972 NM orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (2298 NM orig.)
- `guild-mortgage-metrowest` — GUILD MORTGAGE COMPANY LLC (2173 NM orig.)
- `waterstone-mortgage` — WATERSTONE MORTGAGE CORPORATION (2064 NM orig.)
- `nusenda-credit-union` — NUSENDA (1881 NM orig.)
- `sunward-federal-credit-union` — SUNWARD (1093 NM orig.)
- `primary-residential-mortgage` — PRIMARY RESIDENTIAL MORTGAGE, INC. (1071 NM orig.)
- `veterans-united-west-valley` — MORTGAGE RESEARCH CENTER, LLC (822 NM orig.)
- `amerihome-mortgage` — AmeriHome Mortgage Company, LLC (819 NM orig.)
- `loandepot` — LOANDEPOT.COM, LLC (789 NM orig.)
- `21st-mortgage` — 21ST MORTGAGE CORPORATION (783 NM orig.)
- `bok-financial` — BOKF, National Association (772 NM orig.)
- `pennymac` — PENNYMAC LOAN SERVICES, LLC (593 NM orig.)
- `jpmorgan-chase-bank` — JPMorgan Chase Bank, National Association (543 NM orig.)
- `kirtland-federal-credit-union` — Kirtland Federal Credit Union (504 NM orig.)
- `navy-federal-jacksonville` — Navy Federal Credit Union (500 NM orig.)
- `freedom-mortgage` — FREEDOM MORTGAGE CORPORATION (491 NM orig.)
- `crosscountry-mortgage-metrowest` — CROSSCOUNTRY MORTGAGE, LLC (478 NM orig.)
- `mr-cooper` — NATIONSTAR MORTGAGE LLC (451 NM orig.)
- `dhi-mortgage-buckeye` — DHI MORTGAGE COMPANY, LTD. (432 NM orig.)

## Major markets (panel-ready)

- **Bernalillo** (`35001`) — 14288 originations
- **Sandoval** (`35043`) — 5039 originations
- **Dona Ana** (`35013`) — 4013 originations
- **Santa Fe** (`35049`) — 3074 originations
- **Valencia** (`35061`) — 1924 originations
- **San Juan** (`35045`) — 1627 originations
- **Otero** (`35035`) — 1237 originations
- **Eddy** (`35015`) — 1097 originations
- **Chaves** (`35005`) — 889 originations
- **Lea** (`35025`) — 840 originations
- **Curry** (`35009`) — 816 originations
- **Los Alamos** (`35028`) — 503 originations
- **Taos** (`35055`) — 473 originations
- **Lincoln** (`35027`) — 423 originations
- **Torrance** (`35057`) — 355 originations
- **Grant** (`35017`) — 343 originations
- **Rio Arriba** (`35039`) — 338 originations
- **McKinley** (`35031`) — 288 originations

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has activity in this state
- NM curated: Waterstone Mortgage, Nusenda, Sunward FCU, U.S. Eagle FCU, Kirtland FCU, Sandia Area FCU, Citizens Bank of Las Cruces
- WV curated: City National Bank of WV, Peoples Bank, Clear Mountain Bank (+ Huntington / WesBanco / United Bank / Truist reuse)
- Doña Ana → directory slug `dona-ana` (ASCII-safe)
- Precision over coverage — no fuzzy LEI inventing

## Rebuild

```bash
python scripts/build-hmda-nm-wv-slices.py
```

## Major slugs (for states.ts)

```
'bernalillo', 'sandoval', 'dona-ana', 'santa-fe', 'valencia', 'san-juan', 'otero', 'eddy', 'chaves', 'lea', 'curry', 'los-alamos', 'taos', 'lincoln', 'torrance', 'grant', 'rio-arriba', 'mckinley'
```
