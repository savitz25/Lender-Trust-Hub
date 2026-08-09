# CFPB Consumer Complaint integration — matching notes

**Phase 1 + expansion wave 2 (2026-08)** — mortgage product only, major HMDA-linked national lenders.

## Data source

- Public API: `https://www.consumerfinance.gov/data-research/consumer-complaints/search/api/v1/`
- Docs: https://cfpb.github.io/api/ccdb/
- Snapshot path: `data/cfpb/mortgage-complaints-snapshot.json`
- Refresh: `npm run cfpb:fetch`

## How matching works

1. Directory slug → curated list in `lib/cfpb/mappings.ts`
2. Each mapping lists **exact** CFPB `company` field values (case/punctuation matter)
3. Snapshot stores per-company totals, 24-month window, top issues, timely response, company response buckets
4. Profile panel merges multi-name mappings (e.g. Mr. Cooper, Truist lineage) by summing counts and re-ranking issues

We **do not** fuzzy-match at runtime. Wrong company names return zero hits on the API.

## Known matching quality — wave 1 (core)

| Directory slug | CFPB company name(s) | Quality |
|----------------|----------------------|---------|
| rocket-mortgage | Rocket Mortgage, LLC | High |
| united-wholesale-mortgage | United Shore Financial Services, LLC | Medium–high (legal/DBA) |
| freedom-mortgage | Freedom Mortgage Company | High |
| loandepot | LD Holdings Group, LLC | Medium (holdco label) |
| guaranteed-rate | GUARANTEED RATE INC. | High (trailing `.` required) |
| pennymac | PENNYMAC LOAN SERVICES, LLC. | High (trailing `.` required) |
| jpmorgan-chase-bank | JPMORGAN CHASE & CO. | Medium (parent bank-wide) |
| mr-cooper | NATIONSTAR MORTGAGE LLC + Mr. Cooper Group Inc. | Medium (rebrand / multi-name sum) |
| newrez | Shellpoint Partners, LLC | Lower (affiliate / servicing family) |
| cardinal-financial | CARDINAL FINANCIAL COMPANY, LIMITED PARTNERSHIP | High |
| amerihome-mortgage | AmeriHome Mortgage Company, LLC | High |
| eagle-home-mortgage | Eagle Home Mortgage, LLC | High |
| wells-fargo-bank | WELLS FARGO & COMPANY | Medium (parent bank-wide) |

## Expansion wave 2 (2026-08)

| Directory slug | CFPB company name(s) | Quality / notes |
|----------------|----------------------|-----------------|
| truist-bank | TRUIST FINANCIAL CORPORATION + SUNTRUST BANKS, INC. + BB&T CORPORATION | Medium — lineage multi-sum |
| regions-bank | REGIONS FINANCIAL CORPORATION | Medium (parent) |
| new-american-funding | BROKER SOLUTIONS, INC. | Medium–high (legal/DBA) |
| pnc-bank | PNC Bank N.A. | High (exact published string) |
| better-mortgage | Better Mortgage, Inc. | High |
| ally-bank | ALLY FINANCIAL INC. | Medium (parent; no “Ally Bank” mortgage string) |
| td-bank | TD BANK US HOLDING COMPANY | Medium (parent) |
| usaa-federal-savings-bank | UNITED SERVICES AUTOMOBILE ASSOCIATION | Medium (family label) |
| flagstar-bank | Flagstar Bank, N.A. | High |
| citizens-bank | CITIZENS FINANCIAL GROUP, INC. | Medium (parent; not First Citizens) |
| us-bank | U.S. BANCORP | Medium (parent) |
| sofi-bank | SOFI TECHNOLOGIES, INC. + SoFi Mortgage, LLC | Medium (multi; modest volume) |
| suncoast-credit-union | SUNCOAST CREDIT UNION | High (low volume) |
| academy-mortgage | Academy Mortgage Corporation | High |
| carrington-mortgage | CARRINGTON MORTGAGE SERVICES, LLC | High |
| amerisave | AMERISAVE MORTGAGE CORPORATION | High |
| lakeview-loan-servicing | LAKEVIEW LOAN SERVICING, LLC | High (servicing) |
| first-horizon-bank | FIRST HORIZON BANK | High |
| southstate-bank | SOUTHSTATE BANK CORPORATION | High |
| ameris-bank | AMERIS BANCORP | Medium (parent; no “AMERIS BANK” hits) |
| 21st-mortgage | 21ST MORTGAGE CORP. | High |

## Reviewed but left unmatched

| Directory slug / brand | Why unmatched |
|------------------------|---------------|
| space-coast-credit-union | No exact CCDB company string with mortgage hits (`SPACE COAST CREDIT UNION` → 0). Search noise only. |
| homebridge-financial | No exact `HomeBridge Financial Services…` company string with mortgage hits. Search surface pointed at unrelated labels — not mapped. |

## Limitations (transparency)

- Complaint volume is **not** a finding of fault
- Large originators/servicers get more complaints in absolute terms
- CFPB publication rules (company relationship confirmed or 15 days; some depository exclusions) mean the database is incomplete by design
- “Timely response” is a CFPB field, not our score
- Experimental **complaints / 1,000 FL HMDA originations** mixes **national** complaint windows with **Florida** HMDA originations — rough size context only
- Parent/holdco labels (banks) include more than a single mortgage brand product line

## Path to further expansion

1. Re-run discovery: `npx tsx scripts/_discover-cfpb-names.ts` (or extend candidate list)
2. Confirm exact `company=` filter returns total &gt; 0 before adding
3. `npm run cfpb:fetch` after mapping edits
4. Never invent rankings from raw complaint counts

## UI copy principles

- Always “Source: CFPB…” + data-as-of date
- “We show the public record. You decide.”
- No invented complaint scores
