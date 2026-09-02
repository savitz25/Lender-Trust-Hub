# NJ-LEND-001 official source coverage

Acquired 2026-09-02 against `www.nj.gov` / `www-dobi.nj.gov`. Missing year pages are `SOURCE_NOT_ACQUIRED`, not zero enforcement.

## Office of Consumer Finance

| Year | Official URL | Coverage |
| --- | --- | --- |
| 2006–2013 | `/dobi/division_banking/bankdivenforce_{year}.html` | `ACQUIRED_PARTIAL_HISTORY` (often INDEX_ONLY) |
| 2006–2013 | `/dobi/division_banking/ocf/enforcement/{year}.html` | 404 `SOURCE_NOT_ACQUIRED` (superseded by archive URLs) |
| 2014–2022 | `/dobi/division_banking/ocf/enforcement/{year}.html` | `ACQUIRED_COMPLETE` |
| 2023–2026 | `/dobi/division_banking/ocf/enforcement/{year}.html` | 404 `SOURCE_NOT_ACQUIRED` |

First discovered year: **2006**. Latest published OCF year page: **2022**.

## Depository enforcement

Current snapshot: `/dobi/division_banking/bankdivenforce.html` (`ACQUIRED_CURRENT_SNAPSHOT`).

Listed current years on the index at acquisition: 2020, 2022, 2024, 2025, 2026. Years not listed (including 2021 and 2023) are not a finding of zero actions.

Rescinded archive: `/dobi/division_banking/rescinded.html` (`ACQUIRED_PARTIAL_HISTORY`). Rescinded is not current license or charter status.

## Financial-institution list

`/dobi/bankwebinfo.htm` — page published **9/2/2026**, as of **9/2/2026**. `ACQUIRED_CURRENT_SNAPSHOT`. The list includes state-chartered, federally chartered, out-of-state, and limited-purpose trust entities. Appearance is not a consumer recommendation and is not the OCF licensee denominator.

## Licensee search

Landing: `https://www-dobi.nj.gov/DOBI_LicSearch/`  
Banking form: `https://www-dobi.nj.gov/DOBI_LicSearch/bnkSearch.jsp`

Supported public fields: `LicenseeName`, `LicenseeRefNum` (7 digits), `LicenseType` (optional). POST to `bnkLicenseeSearchServlet`. Active-only. No bulk export. Incapsula present. Automated sample size: 0. Coverage: `SOURCE_AVAILABLE_BY_REQUEST`. See `docs/nj-lend-001-dobi-public-records-request.md`.
