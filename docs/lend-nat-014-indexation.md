# LEND-NAT-014 — National lender profile indexation / sitemap gate

**Status:** COMPLETE WITH BLOCKERS  
**Date:** 2026-08-27  
**Cohort version:** `lend-nat-014-v1`  
**Contract:** `lend-nat-011-v1`  
**No DB migration.** Publication metadata is JSON manifests (no evidence-table writes).

Artifacts:

- `docs/lend-nat-014-audit.json`
- `docs/lend-nat-014-publication-manifest.json` (8,447 rows)
- `docs/lend-nat-014-indexing-cohort.json` (180)
- `docs/lend-nat-014-render-cohort.json` (181)
- `scripts/lend-nat-014-audit.py`
- `lib/national-profile/publication.ts`

---

# A. STATUS

**COMPLETE WITH BLOCKERS**

Deterministic publication policy exists. All 8,447 snapshots were audited. A controlled first indexing cohort of **180** is wired for `index,follow` + bounded sitemap. Mass 8,447 indexation is not enabled. PHH Home Loans fails eligibility and remains render/noindex. Preview/production deploy of this commit is still required before crawlers see the change.

---

# B. PRODUCTION BASELINE

Unchanged identity/evidence counts:

| Metric | Count |
| --- | ---: |
| Institutions | 8,447 |
| LEI | 4,715 |
| NMLS_INSTITUTION | 465 |
| FDIC_CERT | 5,377 |
| person_mlo | 0 |
| branch | 0 |
| CFPB events | 458,146 |
| CFPB labels | 2,499 |
| CFPB bridges | 74 |
| CFPB attached | 195,368 |
| Enforcement events | 17,655 |
| Profile snapshots | 8,447 |
| Live national routes (pre-014) | 10, all noindex |
| Indexable national profiles (pre-014) | 0 |

Production SHA at task start: `28500074c63b8f16bdabe73664a18ed5fe65ea0c`  
Production deploy: `dpl_HKZ8FEA9CUGUmzW3E79aALt9czC2`

---

# C. PUBLICATION ELIGIBILITY POLICY

Statuses are deterministic. Snapshot existence and route existence are not enough.

**PUBLICATION_ELIGIBLE** when all of:

- `institution_id` + recognized contract `lend-nat-011-v1`
- non-blank canonical/display name
- institution stable_key (not person/branch)
- at least one authoritative namespace: NMLS_INSTITUTION, FDIC_CERT, NCUA_CHARTER, LEI, or `gleif-lei:` stable_key
- identity_confidence `confirmed` or `high_confidence`
- at least one research family beyond name+identifier: HMDA, attributed CFPB, enforcement, servicer CONFIRMED/HISTORICAL, depository FDIC/NCUA, geography, or historical names

**PUBLICATION_HOLD** — identity is authoritative but content is name+identifier only.

**IDENTITY_REVIEW** — quarantined NMLS, partial identity without an authoritative namespace, or non-confirmed confidence.

**HISTORICAL_ONLY** — `current_status` inactive/closed/merged/historical, no current HMDA, servicer not CONFIRMED, no attributed CFPB.

**NO_PUBLIC_ROUTE** — missing id/name/contract or non-institution key.

Missing HMDA, CFPB, enforcement, NMLS, or servicer does **not** by itself block eligibility.

Complaint volume is not a quality threshold. Unresolved CFPB labels are not folded.

---

# D. IDENTITY TIER DISTRIBUTION

| Tier | Count |
| --- | ---: |
| multi_identifier | 3,042 |
| fdic_backed | 3,557 |
| nmls_backed | 197 |
| lei_backed | 12 |
| sparse_unresolved | 1,639 |

Tiers measure entity-resolution support, not lender quality.

---

# E. PUBLICATION STATUS COUNTS

| Status | Count |
| --- | ---: |
| PUBLICATION_ELIGIBLE | **3,744** |
| PUBLICATION_HOLD | **189** |
| IDENTITY_REVIEW | **1,639** |
| HISTORICAL_ONLY | **2,875** |
| NO_PUBLIC_ROUTE | **0** |
| **Total** | **8,447** |

Reason codes:

- `identity_safe_with_research_content` 3,743
- `historical_servicer_with_confirmed_identity` 1 (Ocwen Loan Servicing)
- `identity_only_insufficient_research_content` 189
- `partial_identity_no_authoritative_id` 1,639
- `inactive_without_current_lending_or_servicer_evidence` 2,875

---

# F. CONTENT SUFFICIENCY DISTRIBUTION

| Bucket | Count |
| --- | ---: |
| identity_plus_hmda | 2,208 |
| identity_plus_enforcement | 3,557 |
| identity_plus_multiple | 838 |
| identity_only | 1,828 |
| identity_plus_cfpb | 12 |
| servicer_sparse | 3 |
| identity_plus_depository | 1 |

Not a Trust Score, grade, or ranking.

---

# G. HISTORICAL / ALTERNATE NAME AUDIT

Historical / DBA / former names remain on the same `institution_id`. They do **not** generate extra `/lender/{slug}` routes (`routes_from_historical_names = 0`).

Preserved separations:

- Rocket / Quicken on `nmls-inst:3030`
- Freedom Corporation vs unresolved Freedom Company label
- Newrez vs unresolved Shellpoint Partners
- SLS LLC vs SLS Holdings
- PHH Home Loans vs PHH Mortgage Services
- Ocwen Loan Servicing remains its own inactive historical-servicer entity (not rewritten as a successor)

Parent/subsidiary is not treated as the same canonical institution.

---

# H. SLUG / CANONICAL AUDIT

- 8,447 unique slugs after deterministic assignment
- 361 natural name collisions resolved with NMLS/FDIC/NCUA/LEI suffix (never overwritten)
- Original 10 keep editorial slugs
- New slugs use **canonical_name**, not catalog locality/team `display_name`
- Empty `OLD_NATIONAL_PROFILE_SLUGS` map: future name changes redirect old slug → current slug; identity remains `institution_id`

One institution_id → one canonical `/lender/{slug}`.

---

# I. /LENDER VS /LENDERS AUDIT

| Product | Route | Purpose |
| --- | --- | --- |
| National identity intelligence | `/lender/{slug}` | Snapshot PK, HMDA 2025, confirmed CFPB/enforcement |
| Catalog / locality clones | `/lenders/{slug}` | Existing TypeScript directory product |

No canonicalization or redirect between them. Indexing-cohort catalog slug overlap: **0**. Catalog sitemap unchanged.

**Future content policy (do not delete catalog in this task):** keep `/lenders/*` as local/catalog experience; keep `/lender/{slug}` as the national identity page. If Google later sees title overlap, differentiate catalog titles — do not merge the graphs.

---

# J. TITLE / META AUDIT

Title pattern (truthful across empty evidence families):

`{Name} — Independent Lender Research | Lender Trust Hub`

Description mentions only evidence families present on the manifest row (or official identifiers + source transparency). No reviews, ratings, best rates, approval odds, or recommendation.

Official names are not rewritten for SEO. Some `display_name` values still carry catalog locality suffixes (e.g. Bank of America Mortgage (DC)); that is an identity-hygiene item for the completion audit, not a slug rewrite.

No duplicate titles in the indexing cohort.

---

# K. ROBOTS POLICY

`publicLenderRobots({ slug })` returns `index,follow` **only if**:

1. `productionLaunchEnabled`
2. slug is in the approved indexing cohort (`lend-nat-014-v1`)

Otherwise `noindex,nofollow`.

`/lender` landing is always noindex. Unknown slugs noindex then 404.

`app/robots.ts` no longer blanket-disallows `/lender` (that prefix would block the cohort). Per-profile robots + sitemap decide indexation.

---

# L. SITEMAP POLICY

`/sitemap-lenders-national.xml` — **180** URLs, manifest only.

- Does not scan CFPB or HMDA evidence tables
- Does not include `/lenders/*`
- Does not include `/lender` landing
- Does not include PHH Home Loans
- Listed from `robots.ts` when launch is enabled

Exact count: **180**

---

# M. INITIAL INDEXING COHORT

**180** profiles (`lend-nat-014-v1`).

Includes 9 of the original 10 that pass policy. Mix includes large nonbank, large bank, small bank, credit union, confirmed servicer, historical servicer, enforcement present, none observed, CFPB present, no CFPB, HMDA present, no HMDA, multi-identifier.

---

# N. COHORT DIVERSITY

| Dimension | Mix |
| --- | --- |
| Depository | FDIC 98 · NCUA 42 · NONBANK 40 |
| Servicer | NOT ESTABLISHED 170 · CONFIRMED 9 · HISTORICAL 1 |
| HMDA | AVAILABLE 149 · NOT AVAILABLE 31 |
| CFPB attributed | 35 yes · 145 no |
| Enforcement attributed | 60 yes · 120 no |
| HQ states (FDIC CITY/STALP) | 41 distinct; 83 NONE (non-FDIC or no HQ) |

HQ state is not licensure. HMDA geography remains “activity observed.”

---

# O. PUBLICATION MANIFEST

JSON, not a live national query.

Fields: `institution_id`, `stable_key`, `slug`, `publication_status`, `reason`, `added_at`, `cohort_version`.

No SQL required. No `lender_profile_intelligence` writes. No evidence-table writes.

If a table is desired later, do **not** run it as part of this task. Suggested (not applied):

```sql
create table if not exists public.lender_publication_manifest (
  institution_id uuid primary key references public.lender_national_entities(id),
  stable_key text not null,
  slug text not null unique,
  publication_status text not null,
  reason text not null,
  indexable boolean not null default false,
  cohort_version text not null,
  added_at date not null,
  updated_at timestamptz not null default now()
);
```

---

# P. STRUCTURED DATA

Organization / FinancialService / WebPage only. Forbidden: `aggregateRating`, `reviewRating`, `ratingValue`, `reviewCount`. No HMDA metric is a rating.

---

# Q. MOBILE

Profile shell unchanged except index/noindex banner copy. Prior HOST QA (LEND-NAT-012C) passed 390 / 360 / 320 with `scrollWidth === innerWidth`. Source still has `overflow-x-clip`, `min-w-0`, wrapping identifier chips, captioned tables.

---

# R. ACCESSIBILITY

Retained: skip link (`Skip to content`), `main#main-content`, one `h1`, `h2` section cards, table `th scope="col"` + `caption`, text status (not color-only). Chrome DevTools Lighthouse could not be re-run this session (existing chrome-devtools profile lock). No layout redesign.

---

# S. PERFORMANCE

| Surface | Result |
| --- | --- |
| Production Rocket TTFB | **0.648s** (`curl` `time_starttransfer`, HTTP 200) |
| HTML size | **129,995 bytes** |
| Query path | `lender_profile_intelligence` **PK** `entity_id` — **1 query** |
| Sitemap | static JSON read, **0** evidence-table scans |
| Render-time national CFPB/HMDA scans | **none** |

---

# T. CONTROLLED DEPLOYMENT

Render policy (this task):

- **A. Render + noindex:** PHH Home Loans (original QA, PUBLICATION_HOLD)
- **B. 404, not in product cohort:** all other non-indexing institutions, including 3,564 PUBLICATION_ELIGIBLE rows not in the first 180

Do **not** auto-expose 8,447 public routes for SEO.

**Eventual render expansion:** after the 180-URL crawl/index behavior is proven, grow **render-enabled noindex** among PUBLICATION_ELIGIBLE in bands of 250–500, then expand the index cohort. IDENTITY_REVIEW and HISTORICAL_ONLY stay 404 until identity is complete. Do not start at 8,447.

Production may enable **only** these 180 for `index,follow`. Everyone else remains noindex or 404.

---

# U. TEST RESULTS

| ID | Result |
| --- | --- |
| IDX1 | PASS — 8,447 snapshots audited |
| IDX2 | PASS — status deterministic |
| IDX3 | PASS — historical names are not extra profiles |
| IDX4 | PASS — 361 collisions resolved; 8,447 unique slugs |
| IDX5 | PASS — one institution_id per indexed profile |
| IDX6 | PASS — `/lender` and `/lenders` remain separate |
| IDX7 | PASS — HMDA 2025 vintage preserved |
| IDX8 | PASS — missing HMDA does not block |
| IDX9 | PASS — CFPB confirmed attribution only |
| IDX10 | PASS — unresolved labels not folded |
| IDX11 | PASS — complaints ≠ enforcement |
| IDX12 | PASS — enforcement confirmed-only |
| IDX13 | PASS — servicer evidence-only |
| IDX14 | PASS — no Trust Score/ranking |
| IDX15 | PASS — no aggregateRating/reviewRating |
| IDX16 | PASS — cohort 180 (100–250) |
| IDX17 | PASS — only cohort is index,follow |
| IDX18 | PASS — non-cohort noindex or 404; PHH noindex |
| IDX19 | PASS — national sitemap = 180 |
| IDX20 | PASS — `/lender` landing noindex |
| IDX21 | PASS — 390 containment (source + prior HOST) |
| IDX22 | PASS — 360 wrap |
| IDX23 | PASS — 320 usable |
| IDX24 | PASS — skip/main/h1/tables (Lighthouse blocked this session) |
| IDX25 | PASS — snapshot PK |
| IDX26 | PASS — sitemap does not scan evidence tables |
| IDX27 | PASS — `/lenders` catalog sitemap unaffected |
| IDX28 | PASS — national counts unchanged |
| IDX29 | PASS — no Branch/MLO creation |
| IDX30 | PASS — no Florida work |

---

# V. DATA REGRESSION

Required unchanged — observed:

institutions 8,447 · LEI 4,715 · NMLS_INSTITUTION 465 · FDIC_CERT 5,377 · person_mlo 0  
CFPB 458,146 / 2,499 / 74 / 195,368  
enforcement 17,655 · snapshots 8,447 · branch 0

No evidence-table writes. Manifest writes are JSON files only.

---

# W. PUBLIC PRODUCTION IMPACT

**Not live until this commit is deployed.** After Preview/production deploy:

- 180 `/lender/{slug}` pages: `index,follow` + sitemap
- PHH Home Loans: still 200, `noindex,nofollow`
- `/lender` landing: noindex
- Other 8,266 institutions: **404**
- Catalog `/lenders/*` unchanged
- Homepage unchanged

---

# X. ROLLBACK

1. Set `NATIONAL_PROFILE_GATE.productionLaunchEnabled = false` and `sitemap: false`
2. Restore `disallow: ['/lender','/lender/']` in `app/robots.ts` if a blanket block is required
3. Remove `/sitemap-lenders-national.xml` from robots
4. Optionally restore `NATIONAL_PROFILE_COHORT` to the original 10

No database rollback. Manifest files are inert if unused.

---

# Y. FINAL PRODUCT GATE

| | Question | Answer |
| --- | --- | --- |
| A | Total canonical institutions? | **8,447** |
| B | Publication-eligible institutions? | **3,744** |
| C | Publication-hold institutions? | **189** |
| D | Identity-review institutions? | **1,639** |
| E | Initial index cohort size? | **180** |
| F | Current 10 all eligible? | **NO** (PHH Home Loans = PUBLICATION_HOLD) |
| G | Slug collisions safely resolved? | **YES** |
| H | /lender vs /lenders duplication risk understood? | **YES** |
| I | Robots policy safe? | **YES** |
| J | Sitemap policy safe? | **YES** |
| K | Mobile/accessibility pass? | **YES** (source + 012C HOST; Lighthouse not re-run) |
| L | Performance pass? | **YES** |
| M | Controlled indexation safe? | **YES** |
| N | Mass 8,447 indexation safe immediately? | **NO** |
| O | Should Branch identity begin after this? | **NO** — national institution product is not complete (1,639 identity-review, NMLS 465/8,447, CFPB 42.64%) |
| P | Should MLO identity begin after this? | **NO** — `person_mlo` remains 0; company NMLS still human-gated |
| Q | Should Florida begin? | **NO** until national lender completion audit |

---

# Z. RISKS / BLOCKERS

1. **PHH Home Loans** is identity-only (no HMDA, attributed CFPB, enforcement, or servicer). Policy was not overridden for the QA ten.
2. **1,639 IDENTITY_REVIEW** lack an authoritative namespace — 404 until identifiers exist.
3. **2,875 HISTORICAL_ONLY** inactive without current lending evidence.
4. Catalog **display_name locality suffixes** remain on some national entities (not used for new slugs).
5. **NMLS company coverage** still 465 — human-gated Consumer Access.
6. Indexation is **code-complete** but not yet on a hosted Preview/production deploy.
7. Lighthouse/axe could not attach this session (chrome-devtools profile already running).

---

# AA. RECOMMENDED NEXT TASK

**4. NATIONAL LENDER COMPLETION AUDIT**

Do not expand indexation until crawl/search behavior on the 180 is observed. Do not start Branch, MLO, or Florida. The national institution graph still has sparse identity, contaminated display names, and incomplete NMLS/CFPB coverage; a completion audit is the defensible next gate.
