# New Mexico + West Virginia HMDA activation

**Date:** 2026-08-10  
**Scope:** Product-ready HMDA evidence for **New Mexico** and **West Virginia** only.  
**Builder:** `python scripts/build-hmda-nm-wv-slices.py`  
**Sources:** `data/hmda/by-state/{NM,WV}/`

## Product outputs

| State | Folder | Majors (wave 1) | Mappings | Market rows |
|-------|--------|-----------------|----------|-------------|
| New Mexico | `data/hmda/new-mexico/` | Bernalillo, Sandoval, Dona Ana, Santa Fe, Valencia, San Juan, Otero, Eddy, Chaves, Lea, Curry, Los Alamos, Taos, Lincoln, Torrance, Grant, Rio Arriba, McKinley | **146** high-confidence | 18 |
| West Virginia | `data/hmda/west-virginia/` | Berkeley, Kanawha, Jefferson, Monongalia, Cabell, Wood, Raleigh, Putnam, Harrison, Marion, Mercer, Ohio, Hampshire, Greenbrier, Morgan, Fayette, Wayne, Hancock | **141** high-confidence | 21 |

Analyzer prefixes: `nm:{county}`, `wv:{county}`.  
County links: `/local-lenders/new-mexico/...`, `/local-lenders/west-virginia/...`.

### Special naming

- Doña Ana is stored as **Dona Ana** in product CSVs for ASCII-safe slug **`dona-ana`**.
- `countyNameToSlug` also normalizes `ñ` → `n` for robustness.

## Matching rules

1. **Reuse** prior product-state LEI→directory maps when the LEI has NM/WV activity  
2. **National LEI re-identify** (UWM, Rocket, Guild, CrossCountry, Freedom, Huntington, WesBanco, United Bank, Truist, Movement, etc.)  
3. **NM regionals (GLEIF + public NMLS where available):** Waterstone Mortgage (186434), Nusenda (477659), Sunward FCU (451711), U.S. Eagle FCU (463291), Kirtland FCU, Sandia Area FCU, Citizens Bank of Las Cruces  
4. **WV regionals (GLEIF + LEI identity):** City National Bank of West Virginia, Peoples Bank, Clear Mountain Bank  

**Not mapped this pass:** Integrity Home Mortgage, Directors Mortgage, Del Norte CU, State Employees CU, Bayer Heritage FCU, Fairmont FCU, and other regionals without verified NMLS + host.

## Multi-state product wiring

- `lib/hmda/states.ts` — `NM` / `WV` configs + active codes (**47** total with ID/MT/WY)  
- Loaders, queries, analyzer prefixes  
- Identity hosts in `lib/mortgage/nationalHmdaLenders.ts`  

## Parallel work

- **Idaho / Montana / Wyoming** already live in the same window; this activation does not rewrite ID/MT/WY slices  

## Rebuild

```bash
python scripts/build-hmda-nm-wv-slices.py
```
