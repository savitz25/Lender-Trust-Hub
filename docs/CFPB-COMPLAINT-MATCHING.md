# CFPB Consumer Complaint integration — matching notes

**Phase 1 (2026-08)** — mortgage product only, major HMDA-linked national lenders.

## Data source

- Public API: `https://www.consumerfinance.gov/data-research/consumer-complaints/search/api/v1/`
- Docs: https://cfpb.github.io/api/ccdb/
- Snapshot path: `data/cfpb/mortgage-complaints-snapshot.json`
- Refresh: `npm run cfpb:fetch`

## How matching works

1. Directory slug → curated list in `lib/cfpb/mappings.ts`
2. Each mapping lists **exact** CFPB `company` field values (case/punctuation matter)
3. Snapshot stores per-company totals, 24-month window, top issues, timely response, company response buckets
4. Profile panel merges multi-name mappings (e.g. Mr. Cooper) by summing counts and re-ranking issues

We **do not** fuzzy-match at runtime. Wrong company names return zero hits on the API.

## Known matching quality

| Directory slug | CFPB company name(s) | Quality |
|----------------|----------------------|---------|
| rocket-mortgage | Rocket Mortgage, LLC | High |
| united-wholesale-mortgage | United Shore Financial Services, LLC | Medium–high (legal/DBA) |
| freedom-mortgage | Freedom Mortgage Company | High |
| loandepot | LD Holdings Group, LLC | Medium (holdco label) |
| guaranteed-rate | GUARANTEED RATE INC. | High (trailing `.` required) |
| pennymac | PENNYMAC LOAN SERVICES, LLC. | High (trailing `.` required) |
| jpmorgan-chase-bank | JPMORGAN CHASE & CO. | Medium (parent bank-wide) |
| mr-cooper | NATIONSTAR + Mr. Cooper Group | Medium (rebrand / multi-name sum) |
| newrez | Shellpoint Partners, LLC | Lower (affiliate / servicing family) |
| cardinal-financial | CARDINAL FINANCIAL COMPANY, LIMITED PARTNERSHIP | High |
| amerihome-mortgage | AmeriHome Mortgage Company, LLC | High |
| eagle-home-mortgage | Eagle Home Mortgage, LLC | High |
| wells-fargo-bank | WELLS FARGO & COMPANY | Medium (parent bank-wide) |

**Not yet matched (examples):** Truist, Regions, New American Funding, PNC, Better, Ally, TD — CFPB names need deliberate discovery before shipping (avoid false positives).

## Limitations (transparency)

- Complaint volume is **not** a finding of fault
- Large originators/servicers get more complaints in absolute terms
- CFPB publication rules (company relationship confirmed or 15 days; some depository exclusions) mean the database is incomplete by design
- “Timely response” is a CFPB field, not our score
- Experimental **complaints / 1,000 FL HMDA originations** mixes **national** complaint windows with **Florida** HMDA originations — rough size context only

## Path to Phase 2

1. Expand curated mappings after name discovery (search_term + company aggregation)
2. Optional Florida-filtered complaints (`state=FL`) for state panels
3. County views: aggregate matched lenders’ complaint context carefully (or defer)
4. Prefer same-window denominators before promoting a normalized metric (e.g. national originations if available, or FL-only complaints ÷ FL originations)
5. Never invent rankings from raw complaint counts

## UI copy principles

- Always “Source: CFPB…” + data-as-of date
- “We show the public record. You decide.”
- No invented complaint scores
