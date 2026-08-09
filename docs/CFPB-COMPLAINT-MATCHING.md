# CFPB Consumer Complaint integration — matching notes

**Phase 1 + expansion waves 2–3 (2026-08)** — mortgage product only, curated exact company names.

## Data source

- Public API: `https://www.consumerfinance.gov/data-research/consumer-complaints/search/api/v1/`
- Docs: https://cfpb.github.io/api/ccdb/
- Snapshot path: `data/cfpb/mortgage-complaints-snapshot.json`
- Refresh: `npm run cfpb:fetch`
- Discovery helper: `npx tsx scripts/_discover-cfpb-names.ts` (edit candidate list first)

## How matching works

1. Directory slug → curated list in `lib/cfpb/mappings.ts`
2. Each mapping lists **exact** CFPB `company` field values (case/punctuation matter)
3. Snapshot stores per-company totals, 24-month window, top issues, timely response, company response buckets
4. Profile panel merges multi-name mappings (e.g. Mr. Cooper, Truist lineage) by summing counts and re-ranking issues

We **do not** fuzzy-match at runtime. Wrong company names return zero hits on the API.

## Wave 1 — core nationals

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

## Wave 2 — priority expansion list

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

## Wave 3 — directory branch / company slugs (2026-08)

| Directory slug | CFPB company name(s) | Quality / notes |
|----------------|----------------------|-----------------|
| movement-mortgage-myrtle-beach | Movement Mortgage LLC | High (no comma; regional directory slug) |
| navy-federal-jacksonville | NAVY FEDERAL CREDIT UNION | High (regional directory slug) |
| penfed-dc-mid-city | PENTAGON FEDERAL CREDIT UNION | High (regional directory slug) |
| primelending-columbus | PRIMELENDING, A PLAINSCAPITAL COMPANY | High (regional directory slug) |
| fairway-mortgage-augusta-sheppard | Fairway Independent Mortgage Corporation | High (branch/team directory slug) |
| guild-mortgage-west-valley | Guild Holdings Company | Medium (parent holdco; not “Guild Mortgage Company”) |
| crosscountry-mortgage-west-valley | CrossCountry Mortgage LLC | High (no comma; regional directory slug) |
| prmg | PARAMOUNT RESIDENTIAL MORTGAGE GROUP | High (no “, Inc.” in CCDB) |
| dhi-mortgage-buckeye | DHI Mortgage Company | High (regional directory slug) |
| cmg-home-loans-dennis-vo | CMG Financial Services, Inc. | Medium (brand/holdco label for CMG) |
| prmi-aaron-swenson | PRIMARY RESIDENTIAL MORTGAGE | High (no “, Inc.”; branch directory slug) |

## Reviewed but left unmatched

| Directory slug / brand | Why unmatched |
|------------------------|---------------|
| space-coast-credit-union | Exact `SPACE COAST CREDIT UNION` / `Space Coast Credit Union` → **0** mortgage hits. |
| homebridge-financial | Exact HomeBridge / Homebridge Financial Services strings → **0**. Search surface pointed at unrelated “AMA Advisors, LLC.” — **not** mapped. |
| capital-city-home-loans | Search noise (Capital One / Village Capital) — no exact Capital City Home Loans company string with clean hits. |
| floridas-va-mortgage-center | Specialty VA shop; no verified exact CCDB company string in this pass. |
| FAIRWINDS CREDIT UNION / ACHIEVA CREDIT UNION | Exact filters → **0** mortgage hits (no directory national profile required). |
| Bank of America (brand) | Exact `BANK OF AMERICA, NATIONAL ASSOCIATION` **has** high volume, but **no** national directory slug in HMDA national set yet — do not invent a profile solely for CFPB. |

## Limitations (transparency)

- Complaint volume is **not** a finding of fault
- Large originators/servicers get more complaints in absolute terms
- CFPB publication rules (company relationship confirmed or 15 days; some depository exclusions) mean the database is incomplete by design
- “Timely response” is a CFPB field, not our score
- Experimental **complaints / 1,000 FL HMDA originations** mixes **national** complaint windows with **Florida** HMDA originations — rough size context only
- Parent/holdco labels (banks, Guild Holdings, CMG Financial Services) include more than a single branch or brand product line
- Regional directory slugs (Myrtle Beach, Jacksonville, etc.) inherit **company-level** national CFPB totals — not branch-specific complaint counts

## Path to further expansion

1. Confirm exact `company=` filter returns total > 0 before adding (see `scripts/_verify-cfpb-exact.ts` pattern)
2. `npm run cfpb:fetch` after mapping edits
3. Never invent rankings from raw complaint counts
4. Prefer precision over coverage

## UI copy principles

- Always “Source: CFPB…” + data-as-of date
- “We show the public record. You decide.”
- No invented complaint scores
