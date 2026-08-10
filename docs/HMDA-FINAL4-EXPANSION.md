# Final four HMDA activation — Alaska · Hawaii · North Dakota · South Dakota

**Date:** 2026-08-10  
**Scope:** Completes nationwide HMDA product coverage: **50 states + DC**.  
**Builder:** `python scripts/build-hmda-final4-slices.py`  
**Sources:** `data/hmda/by-state/{AK,HI,ND,SD}/`

## Product outputs

| State | Folder | Majors (wave 1) | Mappings | Markets |
|-------|--------|-----------------|----------|---------|
| Alaska | `data/hmda/alaska/` | Anchorage, Matanuska-Susitna, Fairbanks North Star, Kenai Peninsula, Juneau, Ketchikan Gateway, Kodiak Island, Southeast Fairbanks, Chugach, Sitka, Nome, Bethel | **70** | 17 |
| Hawaii | `data/hmda/hawaii/` | Honolulu, Hawaii, Maui, Kauai (full state) | **80** | 4 |
| North Dakota | `data/hmda/north-dakota/` | Cass, Burleigh, Ward, Grand Forks, Morton, Stark, Williams + secondary | **103** | 18 |
| South Dakota | `data/hmda/south-dakota/` | Minnehaha, Pennington, Lincoln, Meade, Lawrence, Codington, Brookings, Brown + secondary | **119** | 19 |

Analyzer prefixes: `ak:`, `hi:`, `nd:`, `sd:`.  
Links: `/local-lenders/alaska/...`, `/local-lenders/hawaii/...`, `/local-lenders/north-dakota/...`, `/local-lenders/south-dakota/...`.

Alaska borough / census-area names are filled from FIPS where source rows omit names (e.g. Chugach).

## High-confidence regionals

| State | Institutions |
|-------|--------------|
| **AK** | Global FCU, Residential Mortgage LLC, First National Bank Alaska, Credit Union 1, Mt. McKinley Bank |
| **HI** | Bank of Hawaii, First Hawaiian Bank, American Savings Bank, Hawaii State FCU, HawaiiUSA FCU, Central Pacific Bank |
| **ND** | Gate City Bank, First International Bank & Trust, First Community CU, Dacotah Bank, Bravera Bank (+ Bell Bank / Alerus reuse) |
| **SD** | Plains Commerce Bank, First Bank & Trust, First PREMIER, Black Hills FCU, First Dakota National Bank, Levo FCU, BankWest (+ First Interstate reuse) |

Nationals re-identified (UWM, Rocket, Newrez, Guild, Freedom, etc.). Precision over coverage.

## Live product set

`HMDA_ACTIVE_STATE_CODES` now includes **51** jurisdictions: **50 states + DC**.

## Rebuild

```bash
python scripts/build-hmda-final4-slices.py
```

## Success criteria

| Criterion | Status |
|-----------|--------|
| AK · HI · ND · SD product slices | Pass |
| Major markets with real volume | Pass |
| Matched lenders show state activity | Pass |
| Existing 47 states unchanged | Pass |
| National coverage complete (50 + DC) | Pass |
