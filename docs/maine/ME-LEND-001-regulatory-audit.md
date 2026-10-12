# Maine consumer-credit and mortgage source audit

Audit baseline: `origin/main` at `2e1202f13973dbc0ff0261bfab624641a0b59a80`. This is not a licensing census.

## Existing Maine coverage

The repository contains a Maine 2025 HMDA slice. Recalculation from its source CSVs yields 16 county market rows, 56,760 applications, 35,441 originations, 9,103 denials, 455 state-summary LEI rows, and 2,531 lender-county activity rows. The separate LEI-to-NMLS crosswalk has 86 rows (83 labeled high match confidence, 3 medium, 81 distinct NMLS identifiers). These are transaction-market observations and mapping candidates, not Maine licensees. The source foundation commit is August 10, 2026; the CFPB snapshot dataset freeze date is June 2, 2026.

## Regulator and distinct populations

Maine Bureau of Consumer Credit Protection (BCCP), within PFR, is the primary nonbank consumer-credit regulator. Its license search identifies NMLS populations including supervised lenders (which include mortgage lenders/servicers and other lenders), loan brokers, and mortgage loan originators, plus other non-mortgage credit classes. The BCCP also has non-NMLS search populations. Do not collapse license classes or turn NMLS identities into Maine authority.

Track company, branch, and MLO person independently. A supervised-lender authorization is broader than “mortgage lender.” HMDA lender activity remains separate from any license.

## Sources

- [BCCP Licensee Search](https://www.maine.gov/pfr/consumercredit/license_search.htm)
- [BCCP Supervised Lender requirements](https://www.maine.gov/pfr/consumercredit/industry/licensing/supervised_lender.htm)
- [BCCP NMLS information and license classes](https://www.maine.gov/pfr/consumercredit/industry/licensing/nmls.html)
- Existing [Maine HMDA slice README](../../data/hmda/maine/README.md)

## Acquisition state

Current NMLS company/branch/MLO snapshots, distinct license counts, status clocks, and attachments: NOT_ACQUIRED. The existing HMDA slice was recomputed from its committed CSVs; no raw LAR source workbook is included in the repository (the 4.76 GB national file is gitignored). No combined total is asserted.
