# Delaware lender evidence packet (DE-LEND-001)

Checked and retrieved: 2026-10-12. Raw source PDFs are retained unchanged under `raw/`.

| Population | Official source clock | Source-reported observations |
| --- | --- | ---: |
| OSBC Licensed Lender company filing records | 2026-09-30 4:16 PM PDT | 486 |
| OSBC Mortgage Loan Broker company filing records | 2026-09-30 4:15 PM PDT | 174 |
| OSBC Approved Mortgage Loan Originator report | 2026-10-01 | 6,309 person records |
| HMDA Delaware-property activity (already-owned slice) | Data year 2025 | 45,536 applications; 26,905 originations; 8,221 denials; 3 county rows; 1,012 lender-county activity observations; 473 LEI summaries; 112 high-confidence directory mappings |

The two licensee PDFs include branches/locations in separate sections, but branch records were not separately counted or reconciled. No company/person/branch cross-class total is created. The MLO figure is the report's own `Total Records` footer; unique individuals were not independently reconciled. HMDA activity and LEI mappings are not licensing.

| Raw attachment | Authority URL | SHA-256 |
| --- | --- | --- |
| `raw/de-licensed-lender-2026-09-30.pdf` | [OSBC Licensed Lender list](https://banking.delaware.gov/wp-content/uploads/sites/73/2026/10/WEB-SEPT-30-Licensed-Lender.pdf) | `039522FB450EFFB57A3A22B0B78FA2C25A73A69FB4A4231E94CF6099A58FACA9` |
| `raw/de-mortgage-loan-brokers-2026-09-30.pdf` | [OSBC Mortgage Loan Broker list](https://banking.delaware.gov/wp-content/uploads/sites/73/2026/10/WEB-SEPT-30-Mortgage-Loan-Broker.pdf) | `25A0B09921220E40FAFC32822A68983CD583CC5BF3641EABEE6321E048C8E6DD` |
| `raw/de-approved-mlos-2026-10-01.pdf` | [OSBC Approved MLO report](https://banking.delaware.gov/wp-content/uploads/sites/73/2026/10/WEB-SEPT-30-Delaware-Approved-Mortgage-Loan-Originator-Report.pdf) | `19D800C508862C405E498B4E4547F37BFB23CD5791811A1F255364125834AB02` |

## Existing population / duplicate audit

Delaware HMDA slices already existed under `data/hmda/delaware/` and were reused without reloading. These market activity files were not joined to state licenses. No current state consumer-finance snapshot for servicer-only, check casher, money transmission, or other OSBC classes was acquired. The regulator says public licensed non-depository listings are updated weekly; use each source's class and date rather than treating the aggregate list as one mortgage population.
