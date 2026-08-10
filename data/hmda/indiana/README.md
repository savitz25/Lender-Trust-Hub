# Indiana HMDA slice

**Source:** `data/hmda/by-state/IN/` (national 2025 foundation)

- County market rows: **48**
- Lender–county activity (major markets): **5522**
- LEI state summaries: **907**
- High-confidence LEI→directory mappings: **124**
- Major markets with names: **20**

## Top mapped LEIs by IN originations

- `rocket-mortgage` — Rocket Mortgage, LLC (9736 IN orig.)
- `ruoff-mortgage` — RUOFF MORTGAGE COMPANY, INC. (6870 IN orig.)
- `united-wholesale-mortgage` — United Wholesale Mortgage, LLC (6308 IN orig.)
- `eagle-home-mortgage` — Eagle Home Mortgage, LLC (4817 IN orig.)
- `primelending-columbus` — PrimeLending, a PlainsCapital Company (3665 IN orig.)
- `first-merchants-bank` — First Merchants Bank (3248 IN orig.)
- `gvc-mortgage` — GVC MORTGAGE, INC. (3231 IN orig.)
- `jpmorgan-chase-bank` — JPMorgan Chase Bank, National Association (2857 IN orig.)
- `first-financial-bank-ohio` — First Financial Bank (2821 IN orig.)
- `pnc-bank` — PNC Bank, National Association (2802 IN orig.)
- `old-national-bank` — Old National Bank (2746 IN orig.)
- `guild-mortgage-metrowest` — Guild Mortgage Company LLC (2580 IN orig.)
- `huntington-national-bank` — The Huntington National Bank (2547 IN orig.)
- `three-rivers-federal-credit-union` — Three Rivers Federal Credit Union (2448 IN orig.)
- `movement-mortgage-myrtle-beach` — Movement Mortgage, LLC (2331 IN orig.)
- `union-home-mortgage-reeves-team` — UNION HOME MORTGAGE CORP. (2257 IN orig.)
- `freedom-mortgage` — Freedom Mortgage Corporation (2201 IN orig.)
- `newrez` — Newrez LLC (2080 IN orig.)
- `german-american-bank` — German American Bank (2053 IN orig.)
- `loandepot` — loanDepot.com, LLC (1952 IN orig.)

## Major markets (panel-ready)

- **Marion** (`18097`) — 22082 originations
- **Hamilton** (`18057`) — 12814 originations
- **Lake** (`18089`) — 12066 originations
- **Allen** (`18003`) — 10769 originations
- **St. Joseph** (`18141`) — 6673 originations
- **Hendricks** (`18063`) — 5946 originations
- **Johnson** (`18081`) — 5646 originations
- **Elkhart** (`18039`) — 4828 originations
- **Porter** (`18127`) — 4710 originations
- **Vanderburgh** (`18163`) — 4421 originations
- **Tippecanoe** (`18157`) — 4347 originations
- **Clark** (`18019`) — 4081 originations
- **Madison** (`18095`) — 3599 originations
- **Hancock** (`18059`) — 3528 originations
- **Boone** (`18011`) — 2802 originations
- **Monroe** (`18105`) — 2741 originations
- **Delaware** (`18035`) — 2659 originations
- **LaPorte** (`18091`) — 2546 originations
- **Morgan** (`18109`) — 2461 originations
- **Floyd** (`18043`) — 2456 originations

## Matching rules

- Reuse prior product-state curated LEI maps when the LEI has state activity
- MI/IN curated: Lake Michigan CU, Mortgage 1, DFCU, Genisys, MSUFCU, First Merchants, GVC Mortgage, 3Rivers FCU, 1st Source, German American, Centier, Lake City Bank
- First Merchants uses LEI identity (no forced company NMLS inventing)
- No fuzzy LEI inventing

## Rebuild

```bash
python scripts/build-hmda-mi-in-slices.py
```

## Major slugs (for states.ts)

```
'marion', 'hamilton', 'lake', 'allen', 'st-joseph', 'hendricks', 'johnson', 'elkhart', 'porter', 'vanderburgh', 'tippecanoe', 'clark', 'madison', 'hancock', 'boone', 'monroe', 'delaware', 'laporte', 'morgan', 'floyd'
```
