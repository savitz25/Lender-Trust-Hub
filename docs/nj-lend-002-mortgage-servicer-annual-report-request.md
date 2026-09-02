# NJ-LEND-002 mortgage servicer license and annual-report request (draft)

Narrow request for New Jersey mortgage-servicer licensing and public annual
report data. Draft only. Not submitted by this ticket.

## Why this request exists

`https://www.nj.gov/dobi/bankdedfund/ded_mortservicer.htm` is a dedicated-funding
FAQ for licensees. It instructs servicers to file the 2025 annual report through
Microsoft Forms by May 1, 2026 and links a worksheet. The worksheet is a blank
filing form, not published results.

Bulletin 19-13 (`https://www.nj.gov/dobi/bulletins/blt19_13.pdf`) was acquired as
an official PDF but is a scanned image; text is not extractable. No public
servicer roster, no public delinquency file, and no public foreclosure-commenced
file were found on the official pages acquired for this ticket.

NMLS Consumer Access is not used as a scrape target.

## Requested records

### A. License / registration universe (business grain)

Current and historical (2020 through latest), distinguishing:

- NJ Mortgage Servicer license
- RMLA-licensed mortgage servicer registration
- any official exempt-servicer class the Department maintains

Fields: NMLS ID, legal name, DBA, NJ license/reference, class, status,
status-effective date, original date, business address.

### B. Annual-report aggregates (2020 through latest filed year)

If licensee-level public data exists, business grain with:

- reporting year
- NMLS ID / legal name / license class
- number of New Jersey residential mortgage loans serviced
- 30-day, 60-day, and 90+-day delinquency counts
- foreclosures commenced
- any other already-public non-PII fields on the worksheet

If licensee-level data is not releasable, statewide aggregates for the same
years and fields.

## Exclude

- borrower names, loan numbers, addresses, account numbers
- consumer narratives
- Social Security numbers and other PII
- Qualified Individual home addresses

## Semantics that must be preserved

- A delinquent loan is not servicer misconduct.
- Foreclosure commenced is not a servicer violation.
- A high default count is not a finding that a servicer is “bad.”
- Lender license is not servicer registration.
- These figures are not a foreclosure score, servicer ranking, or Trust Score.

If rates are later calculated they must carry numerator, denominator, reporting
year, loan population, source, and caveat.

## Purpose

Internal state intelligence. Not a public servicer ranking.

## Delivery preference

CSV/XLSX with field definitions and as-of date, or a written confirmation that
the Department does not publish these aggregates.
