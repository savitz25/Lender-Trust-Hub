# Delaware lending populations audit (DE-LEND-001)

Checked: 2026-10-12. The Delaware Office of the State Bank Commissioner (OSBC) is the authoritative non-depository regulator used here.

## Existing data and acquisition

- Existing Delaware HMDA slices under `data/hmda/delaware/` were audited and reused; no reload was performed.
- New regulator evidence is retained under `data/delaware-lender-001/raw/` with source URLs, clocks, and SHA-256 hashes in its README.
- OSBC September 30, 2026 company reports have 486 Licensed Lender filings and 174 Mortgage Loan Broker filings. The separate MLO report dated October 1, 2026 states 6,309 person records.

## Source classes and disposition

| Grain | Authority/source | Disposition |
| --- | --- | --- |
| Licensed lender companies | [OSBC report, 2026-09-30](https://banking.delaware.gov/wp-content/uploads/sites/73/2026/10/WEB-SEPT-30-Licensed-Lender.pdf) | 486 source-reported company filing rows. |
| Mortgage loan broker companies | [OSBC report, 2026-09-30](https://banking.delaware.gov/wp-content/uploads/sites/73/2026/10/WEB-SEPT-30-Mortgage-Loan-Broker.pdf) | 174 source-reported company filing rows. |
| Mortgage loan originator persons | [OSBC report, 2026-10-01](https://banking.delaware.gov/wp-content/uploads/sites/73/2026/10/WEB-SEPT-30-Delaware-Approved-Mortgage-Loan-Originator-Report.pdf) | 6,309 report records. Unique person identifiers were not independently reconciled. |
| Company branches/locations | Branch sections in the OSBC lender/broker reports | Present as a separate source grain; branch counts NOT_ACQUIRED. |
| Other consumer finance | [OSBC weekly non-depository listing](https://banking.delaware.gov/non-depository-institutions/) and [licensing-help page](https://banking.delaware.gov/faqs/licensing-help/) | Separate lender, check-casher, money-transmitter, motor-vehicle sales-finance, and other class programs. Current rows for unacquired classes NOT_ACQUIRED. |
| HMDA property-market activity | Existing CFPB/FFIEC 2025 foundation in `data/hmda/delaware/` | 45,536 applications; 26,905 originations; 8,221 denials; 3 counties; 1,012 lender-county observations; 473 LEI state rows; 112 curated high-confidence LEI mappings. Not a license source. |

## Grain and reconciliation

No company, branch, MLO person, bank charter, HMDA filing, or LEI mapping was merged into a unified census. No independent servicing-only license class or current servicer extract was established in this pass. Missing acquisition is NOT_ACQUIRED, not zero.
