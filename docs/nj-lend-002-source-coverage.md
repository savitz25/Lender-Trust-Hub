# NJ-LEND-002 official source coverage

Acquired 2026-09-02 against `www.nj.gov`, `www-dobi.nj.gov`, NJHMFA, and the
committed HMDA New Jersey slice. Unavailable sources are coverage states, not
zero counts.

## RMLA business licenses

| Source | URL | Coverage |
| --- | --- | --- |
| Legacy lenders page | `/dobi/liclenders.htm` | Redirect stub to Banking Licensees menu |
| RMLA application page | `/dobi/banklicensing/liclend_newapps.html` | `ACQUIRED_CURRENT_SNAPSHOT` of **instructions**, not a roster |
| Class descriptions | `/dobi/banklicensing/rmla/*.html` | `ACQUIRED_CURRENT_SNAPSHOT` |
| Banking licensee search | `https://www-dobi.nj.gov/DOBI_LicSearch/` | `SOURCE_AVAILABLE_BY_REQUEST` (active-only, Incapsula, no bulk) |
| NMLS Consumer Access | `https://www.nmlsconsumeraccess.org/` | HTTP 403 `SOURCE_ACCESS_BLOCKED` |

No deterministic bulk roster. See `docs/nj-lend-002-rmla-license-roster-request.md`.

## Mortgage servicers

| Source | URL | Coverage |
| --- | --- | --- |
| Dedicated funding FAQ | `/dobi/bankdedfund/ded_mortservicer.htm` | `ACQUIRED_CURRENT_SNAPSHOT` of filing instructions |
| 2025 annual-report worksheet | `/dobi/bankdedfund/annualreportworksheets/MortgageServicer2025.pdf` | Blank form; not published results |
| Bulletin 19-13 | `/dobi/bulletins/blt19_13.pdf` | File acquired; scanned `IMAGE_ONLY` |

Licensee-level and statewide annual-report data: `SOURCE_AVAILABLE_BY_REQUEST`.

## NJHMFA

| Source | URL | Coverage | Source date |
| --- | --- | --- | --- |
| Participating Lender Partners PDF | `/dca/hmfa/homebuyers-and-renters/docs/hb_lender_list.pdf` | `ACQUIRED_CURRENT_SNAPSHOT` (incomplete vs all approved) | 2026-04-01 |
| Homebuyer programs | `/dca/hmfa/homebuyers-and-renters/homebuyers/` | `ACQUIRED_CURRENT_SNAPSHOT` | page + 2026-06-17 fact sheets |
| Income / purchase-price limits | CoBranded FTHB fact sheet | `ACQUIRED_CURRENT_SNAPSHOT` | 2026-06-17 |
| DPA by county group | Smart Start Plus fact sheet | `ACQUIRED_CURRENT_SNAPSHOT` | current fact sheet |
| Site Evaluator | `/dca/hmfa/homebuyers-and-renters/uta/` | `OPEN_SEARCH_ONLY` | — |
| Lender portal / 2026 bulletins | `/dca/hmfa/lenders/lenderportal/` | `ACQUIRED_CURRENT_SNAPSHOT` | index revised 2026-08-20 |

## HMDA

Reuse `data/hmda/new-jersey/` (HMDA 2025, all 21 counties). Do not download a
second national universe. Median loan amount, interest rate, and denial reasons
are not in the committed summary extract (`PARTIAL_SOURCE_COVERAGE`).

## Complaints

CIRC intake page `/dobi/consumer.htm`: no public aggregates.
`SOURCE_AVAILABLE_BY_REQUEST`. See
`docs/nj-lend-002-dobi-complaint-aggregate-request.md`.

## Financial-institution list

Preserved from NJ-LEND-001 (`/dobi/bankwebinfo.htm`, as of 2026-09-02). Not
duplicated. Charter type remains separate from mortgage license and NJHMFA
participation.
