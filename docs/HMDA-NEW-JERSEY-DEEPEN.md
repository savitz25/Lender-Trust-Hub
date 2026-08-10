# New Jersey HMDA deepen pass

**Goal:** Make New Jersey feel deeper than the initial major-county launch without inventing low-confidence matches.

## What improved

### County market intelligence (panel-ready)

| Wave | Counties |
|------|----------|
| **Initial** | 18 majors (Ocean, Bergen, Monmouth, Middlesex, Burlington, Camden, Essex, Morris, Union, Gloucester, Mercer, Hudson, Passaic, Somerset, Atlantic, Cape May, Sussex, Hunterdon) |
| **Deepen** | **+3** — Cumberland, Warren, Salem (**21** total = full NJ extract) |

Each major county resolves `getHmdaCountyEvidence('new-jersey', slug)` for apps, originations, denials, loan mix, and top matched lenders where activity exists.

Rebuild: `python scripts/build-hmda-new-jersey-slice.py`

### High-value lender mapping

| Metric | Before | After |
|--------|--------|-------|
| High-confidence LEI → directory maps | 68 | **79** |
| Lender–county activity rows (majors) | ~6.8k | **~7.5k** |
| Major named counties | 18 | **21** |

**New NJ-focused LEI maps (GLEIF legal name + published company NMLS):**

| Institution | NMLS | Directory slug |
|-------------|------|----------------|
| AnnieMac (American Neighborhood Mortgage) | 338923 | `anniemac-home-mortgage` |
| OceanFirst Bank | 409701 | `oceanfirst-bank` |
| Valley National Bank | 411254 | `valley-national-bank` |
| M&T Bank | 381076 | `mt-bank` |
| Embrace Home Loans | 2184 | `embrace-home-loans` |
| NFM Lending | 2893 | `nfm-lending` |
| Citibank | 412915 | `citibank` |
| Advisors Mortgage Group (Ocean, NJ) | 33041 | `advisors-mortgage-group` |
| Absolute Home Mortgage (Fairfield, NJ) | 176743 | `absolute-home-mortgage` |
| Prosperity Home Mortgage | 75164 | `prosperity-home-mortgage` |
| Columbia Bank (Fair Lawn, NJ) | 504284 | `columbia-bank-nj` |

### Directory / hygiene

- `lib/mortgage/nationalHmdaLenders.ts` — eleven NJ-deepen national / regional profiles
- `lib/geo/zip-to-county.ts` — ZIP hints for Cumberland / Warren / Salem
- Multi-state primary-state behavior unchanged (FL/TX/GA/CA/NC/SC/NJ)

## Mapping coverage summary

- **Mapped LEIs with NJ originations:** 79 high-confidence directory links
- **Unmapped residual:** large credit unions (Police & Fire FCU, Affinity FCU, Visions FCU), private-money / non-QM niches (Kiavi, Loan Funder), and community names without a verified public company NMLS + host pair (e.g. Provident Bank company ID not confidently published on primary mortgage pages, Manasquan Bank, NJ Lenders Corp.)
- **Reuse path:** FL / TX / GA / CA / NC / SC curated LEIs still apply when the LEI has NJ activity

## Intentionally deferred

- Low-confidence LEI inventing for remaining blanks
- Thin invented local branch profiles just to close volume gaps
- Next Northeast state (NY / PA / MA)

## Files

- `scripts/build-hmda-new-jersey-slice.py`
- `lib/hmda/states.ts` — NJ major set (all 21)
- `data/hmda/new-jersey/*` — rebuilt slice
- `lib/mortgage/nationalHmdaLenders.ts`
- `docs/HMDA-NEW-JERSEY-EXPANSION.md` — initial launch notes
