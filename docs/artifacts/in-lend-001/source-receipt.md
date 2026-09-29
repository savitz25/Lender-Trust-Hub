# IN-LEND-001 source receipt

Official Indiana sources retrieved 2026-09-29. The accepted national 2025 HMDA Indiana-property partition was reused; no national re-ingestion occurred. Raw acquisitions stay in gitignored `data/raw/indiana/`; `scripts/build-in-lend-001.py` freezes `lib/indiana-intelligence/evidence.json` (fingerprint `457d96fd…c903`, `--check` in CI-safe mode).

## Split regulators

- **DFI (Consumer Credit Division)** licenses mortgage lenders and DFI-sponsored MLOs; regulatory work = registration/licensing, examinations, annual renewals, consumer complaints ([division page](https://www.in.gov/dfi/general-information/consumer-credit-division)).
- **Secretary of State, Securities Division** licenses loan brokers, each branch office, and loan-broker MLOs/managers under the Indiana Loan Broker Act, IC 23-2.5 ([loan brokers](https://securities.sos.in.gov/loan-brokers/)).

## Licensing

- [DFI Consumer Credit listing — Mortgage Lender](https://extranet.dfi.in.gov/ConsumerCredit/CompanyListing/13?handler=CompaniesInLicenseType), retrieved 2026-09-29T19:01:27Z (no DFI as-of date): 490 listing rows, 489 distinct companies (one listed twice). Each linked entity page shows exactly one Activated Mortgage Lender license (Indiana license number + issue date). 23 list an Indiana address. No NMLS ID printed: rows with printed NMLS 0; exact NMLS bridges 0; no name joins. Street addresses and phones not republished. No separate servicer class. DFI MLO roster NOT_ACQUIRED.
- Securities Division [Registration Search](https://securities.sos.in.gov/public-portfolio-search/) excludes loan brokers and points to NMLS Consumer Access. Loan Broker, branch-office and Loan Broker MLO rosters = NOT_ACQUIRED; verification = KNOWN.

## Enforcement

- [Securities Division Administrative Action Search](https://lcm.securities.sos.in.gov/admin-actions-search): full index captured through the page's own reCAPTCHA-backed request (1,747 rows, two pages of 1,000). 14 actions dated 2022–2026 carry the Loan Broker entity type (none dated 2022–2023). Two of them (26-0004 CA, 26-0014 CA) cite only the Uniform Securities Act (IC 23-19) and involve individual respondents; they are counted but excluded from the Loan Broker Act layer. The 12 Loan Broker Act orders are all company respondents; each prints the company's own NMLS ID; order PDFs are SHA-256 pinned in the builder. 7 company NMLS IDs returned EXACT_IDENTITY (unpublished research identity) from the production exact-NMLS lookup; 5 NO_CONFIDENT_MATCH. Public-profile adverse attachments 0; name-only adverse joins 0. Control persons and individual co-respondents are withheld. Dates are the Division index dates (the search UI renders them one day earlier in US Eastern time). Penalties are Indiana-only order terms. The Division states the index is not exhaustive.
- DFI publishes no mortgage enforcement-order index: DFI order rows 2022–2026 = NOT_ACQUIRED. The DFI revoked-license list shows no mortgage revocations in the window.
- [NewRez LLC multistate agreement (CSBS copy)](https://www.csbs.org/sites/default/files/external-link-files/NewRez%20Final%20Agreement%20with%20attachments%20-%20redacted.pdf): prints NMLS 3013; Indiana is a Participating State in Appendix A with a per-state payment of $61,686.09 of the $15.5 million multistate total; the Indiana signatory agency is not in the extractable text. No canonical attachment.

## Examinations and complaints

DFI examination capability KNOWN; Securities Division loan-broker examination authority KNOWN (11 of 12 orders arose from Loan Broker Examinations). Provider-level examination results NOT_ACQUIRED. DFI and Securities Division complaint intake KNOWN; provider complaint rows NOT_ACQUIRED; outcomes REQUEST_ONLY/NOT_ACQUIRED. A complaint is not an enforcement finding.

## Counts that are not published

No combined DFI + Securities Division "Indiana lenders" total. Loan Broker, branch and MLO counts are unknown, not zero. HMDA 2025 (285,688 applications; 907 LEIs; 92 counties) is property activity, never added to licensing counts. New canonical organizations, graph writes and claim eligibility changes = 0. No universal Indiana as-of date.
