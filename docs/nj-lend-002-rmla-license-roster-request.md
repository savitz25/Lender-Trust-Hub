# NJ-LEND-002 RMLA company / branch license roster request (draft)

Narrow request for current and historical New Jersey Residential Mortgage
Lending Act business licenses. Draft only. Not submitted by this ticket.

## Why this request exists

Official pages at `https://www.nj.gov/dobi/liclenders.htm` (redirects to the
Banking Licensees menu) and
`https://www.nj.gov/dobi/banklicensing/liclend_newapps.html` describe how to
apply through NMLS. They are not a licensee roster.

The public Banking Licensee Search is active-only, name-or-reference lookup,
Incapsula-protected, and does not offer a bulk export. NMLS Consumer Access
returned HTTP 403 to this research user-agent. This ticket does not bypass
WAF, CAPTCHA, authentication, or anti-automation controls, and does not
enumerate the search form record-by-record.

Absence from an active-only search is not proof that a company is unlicensed,
expired, surrendered, or never licensed.

## Requested records

Business-entity and branch grain only (priority over individuals), 2018 through
the current date, as a delimited file or official spreadsheet:

- NMLS unique identifier (company and branch)
- legal name
- DBA
- NJ license / reference number
- license class:
  - Residential Mortgage Lender
  - Correspondent Residential Mortgage Lender
  - Residential Mortgage Broker
  - Exempt Company Registrant
  - Registered Depository Institution
  - matching branch classes
- status (current, expired, suspended, surrendered, and any other official value)
- status-effective date
- initial / original date
- expiration or renewal-through date
- main-office and branch business addresses
- branch-to-company NMLS relationship

## Exclude

- Social Security numbers
- fingerprints, credit reports, background-investigation files
- personal email
- residential / home addresses
- dates of birth
- other protected individual information
- bulk Mortgage Loan Originator harvest
- Qualified Individual home addresses or private contact data

Qualified Individual and Mortgage Loan Originator records, if released at all,
must remain separately typed. A Qualified Individual is not the company.

## Purpose

Internal regulatory identity for company and branch licenses. Not a public
RMLA directory, not an MLO directory, and not a consumer ranking.

## Delivery preference

CSV or XLSX with field definitions, as-of date, and status vocabulary.
Include historical status changes, not only the current active snapshot.
