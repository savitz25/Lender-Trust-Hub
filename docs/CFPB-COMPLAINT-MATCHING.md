# CFPB Consumer Complaint integration — matching notes

**Waves 1–4 (2026-08)** — mortgage product only, curated exact company names + optional company-NMLS inheritance for branch listings.

## Data source

- Public API: `https://www.consumerfinance.gov/data-research/consumer-complaints/search/api/v1/`
- Docs: https://cfpb.github.io/api/ccdb/
- Snapshot path: `data/cfpb/mortgage-complaints-snapshot.json`
- Refresh: `npm run cfpb:fetch`
- Discovery helpers: `scripts/_discover-cfpb-names.ts`, `scripts/_discover-cfpb-wave4.ts`, `scripts/_verify-cfpb-exact.ts`

## How matching works

1. Directory profile → `resolveCfpbMapping({ slug, nmlsId })` in `lib/cfpb/mappings.ts`
2. Prefer **exact slug** mapping; else match **company NMLS** (`nmlsIds` on the mapping) so regional branch listings inherit the same CFPB company
3. Each mapping lists **exact** CFPB `company` field values (case/punctuation matter)
4. Snapshot stores per-company totals, 24-month window, top issues, timely response, company response buckets
5. Profile panel merges multi-name mappings by summing counts and re-ranking issues

We **do not** fuzzy-match at runtime. Wrong company names return zero hits on the API.

## Wave 4 additions (2026-08)

### New exact company mappings

| Primary directory slug | CFPB company name(s) | Company NMLS inheritance | Notes |
|------------------------|----------------------|--------------------------|-------|
| bank-of-america-mortgage-silicon-valley | BANK OF AMERICA, NATIONAL ASSOCIATION | 399802 | Bank-wide; all BoA Mortgage directory rows with 399802 |
| veterans-united-jacksonville | Mortgage Research Center, LLC | 1907 | VU legal entity / DBA in CCDB |
| lennar-mortgage-clovis | Lennar Financial Services, LLC | 1058 | Not “Lennar Mortgage, LLC” |
| supreme-lending-south-florida | Supreme Lending | 2129 | Exact company string |
| acrisure-mortgage | FBC MORTGAGE, LLC + Acrisure Mortgage Partners, LLC | 152859 | Multi-sum (former FBC + current label) |
| union-home-mortgage-reeves-team (and coastal / myrtle-beach slugs) | Union Home Mortgage Corp | — (explicit slugs) | No trailing period; LO NMLS differs by team |
| city-national-bank-mortgage | CITY NATIONAL BANK | 5369 | Not City National Bank of Florida |
| fifth-third-bank | FIFTH THIRD FINANCIAL CORPORATION | 3444, 399800 | Parent label; reserved for profiles |
| huntington-bank | HUNTINGTON NATIONAL BANK, THE | — | Trailing “THE” required |
| keybank | KEYCORP | — | Parent label |
| capital-one | CAPITAL ONE FINANCIAL CORPORATION | — | Parent label |
| citibank | CITIBANK, N.A. | — | Trailing period required |
| discover-bank | DISCOVER BANK | 3656 | Exact |
| synovus-bank | Synovus Bank | — | Exact |

### NMLS inheritance (wave 4 infrastructure)

Branch listings that share a **company NMLS** now resolve CFPB without per-slug rows, including e.g.:

- All `bank-of-america-mortgage-*` with NMLS **399802**
- All `veterans-united-*` with NMLS **1907**
- All `guild-mortgage-*` with NMLS **3274** → Guild Holdings Company
- All `crosscountry-mortgage-*` with NMLS **3029**
- All `movement-mortgage-*` with NMLS **39179**
- All `new-american-funding-*` with NMLS **6606**
- All `lennar-mortgage-*` with NMLS **1058**
- All `acrisure-mortgage-*` with NMLS **152859**

(Exact company strings remain those already documented in waves 1–3.)

## Waves 1–3 (summary)

See git history for full tables. Core nationals (Rocket, UWM, Freedom, loanDepot, Guaranteed Rate, PennyMac, Chase, Wells, Mr. Cooper, Truist, Regions, PNC, Better, Ally, TD, USAA, Flagstar, Citizens, U.S. Bank, SoFi, SouthState, Ameris, First Horizon, etc.) remain mapped with exact CCDB names.

## Reviewed but still unmatched

| Brand / slug | Why |
|--------------|-----|
| **space-coast-credit-union** | Exact company filters → **0** mortgage hits |
| **homebridge-financial** | Exact HomeBridge strings → **0**. Search hits only unrelated **AMA Advisors, LLC.** — not mapped |
| **floridas-va-mortgage-center** | No exclusive CCDB company string (search mixes Freedom/Navy Federal/etc.) |
| **capital-city-home-loans** | No exact company string; search noise (Capital One / Village Capital) |
| **City National Bank of Florida** | No exact mortgage company hits under that name |
| **fairway-mortgage-upstate** | Directory row has empty NMLS and no dedicated slug mapping — fix NMLS on the listing or add slug row |
| **PierPoint Mortgage** | Search total 0 for brand |
| Tiny local brokers without a clean exclusive CCDB label | Left unmatched by design |

## Limitations (transparency)

- Complaint volume is **not** a finding of fault
- Large originators/servicers get more complaints in absolute terms
- CFPB publication rules mean the database is incomplete by design
- “Timely response” is a CFPB field, not our score
- Experimental **complaints / 1,000 FL HMDA originations** mixes **national** complaints with **Florida** HMDA originations
- Parent/holdco labels (banks, Guild Holdings, CMG Financial Services) are broader than a single branch brand
- NMLS inheritance applies company-level national totals to every branch profile sharing that company NMLS

## Path to further expansion

1. Confirm exact `company=` total > 0 before adding
2. Prefer attaching `nmlsIds` so all branch listings inherit
3. `npm run cfpb:fetch` after mapping edits
4. Never invent rankings from raw complaint counts

## UI copy principles

- Always “Source: CFPB…” + data-as-of date
- “We show the public record. You decide.”
- No invented complaint scores
