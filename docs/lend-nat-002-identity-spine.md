# LEND-NAT-002 — National institution identity spine + typed identifier graph

**Status:** COMPLETE WITH BLOCKERS  
**Date:** 2026-08-26  
**Public production impact:** NONE  
**Production writes:** NOT executed

Companion: `docs/lend-nat-002-manifest.json`

---

## A. STATUS

**COMPLETE WITH BLOCKERS**

Additive graph schema, in-memory seed, deterministic LEI attach, collision quarantine, ID1–ID18 tests, and an immutable dry-run manifest are in the production-matching worktree.

Blocker: production database identity was **not** verified (no `.env` / `.env.local`, Vercel/Neon MCP unauthenticated). Per task rules: migration/code/tests only; **no production writes**.

---

## B. EXECUTION BASELINE

| Item | Value |
| --- | --- |
| Worktree | `C:\Users\makei\lender-trust-hub-ask-search-009` |
| Branch | `ask-search-009-release-lender` |
| Starting SHA | `d6f2ffe29aec1524ca17810fc3d43ef65aa1d745` |
| Ending SHA | **same HEAD** (work uncommitted; not applied to production) |
| `origin/main` | `393d7ad08f48a804d3442869f0a52ee1cde64024` |
| Divergence | ask-search-009 and main each have unique commits (Ask handoff vs contact-001). **Catalog counts match live production** (629 / 1,049 / 463). |
| Stale checkout **not used** | `C:\Users\makei\lender-trust-hub` `main` `9cb4318…` |
| Production DB | **UNVERIFIED** — no local Supabase env; health client exists but was not written to |
| Intended persistence | Supabase PostgreSQL, additive migration `20260826120000_national_institution_identity_spine.sql`, service-role RLS |
| Current public writes | Compile-time TypeScript catalog remains authoritative for `/lenders` and `/local-lenders` |

Worktree matches LEND-NAT-001 production catalog lineage. Graph was **not** built on the stale checkout.

---

## C. GRAPH SCHEMA

Additive tables (do not alter `public.lenders`):

| Table | Role |
| --- | --- |
| `lender_national_entities` | `institution` / `branch` / `person_mlo`. LEND-NAT-002 seeds **institutions only**. `stable_key` unique (`nmls-inst:{nmls}`). |
| `lender_identifiers` | Typed IDs; unique `(identifier_type, identifier_value)`. `entity_id` nullable for unresolved evidence. |
| `lender_entity_names` | `legal` / `display` / `dba` / `alternate` — never overwrite |
| `lender_source_record_links` | unique `(source_dataset, source_record_id)` |
| `legacy_lender_bridges` | unique `(legacy_source, legacy_row_id)` — internal only |
| `lender_identity_conflicts` | quarantine / review |
| `lender_entity_classifications` | editorial type stored as **non-authoritative**; family defaults `UNKNOWN` |
| `lender_entity_relationships` | `SUBSIDIARY_OF` / `PARENT_OF` / `BRAND_OF` / `SUCCESSOR_TO` / `PREDECESSOR_OF` — empty |

Identifier namespaces: `NMLS_INSTITUTION`, `NMLS_BRANCH`, `NMLS_PERSON`, `LEI`, `FDIC_CERT`, `NCUA_CHARTER`, `RSSD`, `FHA_ID`, `HUD_ID`, `SBA_ID`, `STATE_LICENSE`, `OTHER_AUTHORITATIVE`.

Trigger rejects LEI strings in NMLS columns, non-digit CERT/RSSD/charter, invalid LEI length.

RLS: service role only. Not a public projection.

---

## D. PUBLIC CATALOG CENSUS (recomputed)

| Metric | LEND-NAT-001 expected | Recomputed |
| --- | ---: | ---: |
| Location / geo rows | 1,049 | **1,049** |
| Distinct companies | 629 | **629** |
| NMLS-verified companies | 463 | **463** |
| Unique slugs | — | 1,048 |
| Duplicate slugs | first-tech | `first-tech-federal-credit-union` |

Public catalog fingerprint unchanged after graph build.

---

## E. NMLS TYPE AUDIT (row-level)

| Class | Rows |
| --- | ---: |
| CONFIRMED_INSTITUTION_NMLS | 880 |
| LIKELY_BRANCH_NMLS | 1 (Fairway 2909) |
| LIKELY_PERSON_OR_TEAM_NMLS | 0 in live catalog (Dennis Vo row already uses company 1820; 2458338 remains quarantined in maps) |
| COLLISION | 2 |
| MISSING | 165 |
| UNKNOWN | 1 |

Distinct numeric NMLS on rows: 464. Confirmed **institution** NMLS seeded: **460**.

---

## F. NATIONAL INSTITUTION COHORT

**460** confirmed institutions.

- One institution per confirmed institution NMLS.
- 880 catalog rows + 420 geo clones attach to those 460 (not 880 entities).
- HQ state / slug are **not** identity.
- `current_status = unknown` (not active).
- Normalized classification = `UNKNOWN` (catalog `Bank`/`Broker` stored as non-authoritative raw label).

463 verified − 1 branch NMLS − 2 collision NMLS = **460**. The three excluded IDs stay diagnostics.

---

## G. TYPED IDENTIFIER MODEL

| Type | Rows | Attached to institution |
| --- | ---: | --- |
| NMLS_INSTITUTION | 460 | 460 |
| NMLS_BRANCH | 1 | 0 |
| NMLS_PERSON | 0 live (quarantine key reserved) | 0 |
| LEI | 4,715 | 246 CONFIRMED |
| FDIC_CERT | 0 created | 0 |
| NCUA / RSSD / FHA / HUD / SBA / STATE_LICENSE | schema-ready | 0 |

Cross-namespace substitution is rejected in code + SQL trigger.

---

## H. GLEIF / LEI SOURCE AUDIT

Existing cache: `data/hmda/florida/_gleif_name_cache.json` — **745** legal names only.

| Field | In cache |
| --- | --- |
| Legal name | YES (745 / 4,715 = **15.8%** of national LEIs) |
| LEI status, legal/HQ address, RA, RA entity ID, parents, successor, entity status | **NO** |

GLEIF does **not** yield NMLS. No bulk GLEIF API pull in this task.

---

## I. LEI ↔ NMLS RESOLUTION RULES

**CONFIRMED attach** only when all hold:

1. Exactly one NMLS for that LEI across mapping files  
2. That NMLS is `CONFIRMED_INSTITUTION_NMLS`  
3. Method includes curated public-NMLS / company NMLS (not name-only)  
4. LEI not in named quarantine  
5. That NMLS is not mapped to multiple LEIs (preserve separate LEIs until explained)

**Never CONFIRMED:** name, website, HQ address, GLEIF name, directory slug match alone.  
**HIGH_CONFIDENCE is not auto-attached.**  
**REVIEW_REQUIRED** stays unattached.  
**UNRESOLVED** LEIs remain identifier rows with `entity_id` null.

---

## J. COLLISION CENSUS (recomputed, unchanged vs LEND-NAT-001)

| Metric | LEND-NAT-001 | Now |
| --- | ---: | ---: |
| LEIs with any NMLS map | 438 | **438** |
| Distinct mapped NMLS | 288 | **288** |
| One LEI → one NMLS | — | 280 |
| One LEI → many NMLS | 13 | **13** |
| One NMLS → one LEI | — | 270 |
| One NMLS → many LEI | 18 | **18** |
| CONFIRMED attached LEIs | — | **246** |
| Unresolved/unattached LEIs | — | **4,469** |
| Review-required LEI identifiers | — | 28 |

---

## K. KNOWN COLLISION RESULTS

| Case | Disposition |
| --- | --- |
| **Fairway** 2909 vs 1702; LEI `RVDPPPGHCGZ40J4VQ731` | **quarantined**. 2909 stored as `NMLS_BRANCH`, not institution. No auto-merge to PennyMac 35953. |
| **CMG** 2458338 vs 1820; LEI `254900DTLHVWQ7NP7R34` | **quarantined**. Live catalog row already uses 1820; team ID not written as `NMLS_INSTITUTION`. |
| Movement / Veterans United LEI `549300DD5QQUHO6PCH70` | **quarantined** (one LEI → 1907 + 39179) |
| PennyMac / Fairway same LEI | **quarantined** |
| Guaranteed Rate / Bank of America LEI `B4TYDEB6GKMZO031MB27` | **quarantined** |
| HarborOne / Summit NMLS 2561 | **quarantined** |
| Cadence / Huntington NMLS 402436 | **quarantined** |
| First Tech duplicate slug | **recorded** (slug is not an identity key) |

---

## L. HMDA LEI RESULTS

| | |
| --- | ---: |
| Total national LEIs represented as identifiers | **4,715** |
| Deterministically attached to an institution | **246** |
| Unattached (unresolved + review) | **4,469** |

No HMDA application/summary files rewritten.

---

## M. FDIC PREPARATION RESULTS

4,846 rows / **4,041** certs. **0** `FDIC_CERT` identifiers created. **0** merges.

63 exact legal-name overlaps (e.g. Truist cert 9846; Citizens Bank matches **many** certs). Name match = **UNRESOLVED / REVIEW_REQUIRED**, not attached. Namespace is schema-ready.

---

## N. SOURCE RECORD LINKAGE

**5,764** links:

- `public_catalog` × 1,049 rows (confirmed attach or unresolved/review)
- `hmda_2025_lei` × 4,715 LEIs

Catalog row is never the national entity.

---

## O. LEGACY BRIDGE RESULTS

**1,049** bridges (one per catalog row).

- Confirmed NMLS rows → institution, `HEADQUARTERS_CATALOG_REPRESENTATION` or `GEO_DISCOVERY_CLONE` (**420** clones linked)
- Others → `entity_id` null
- **0** `HAS_BRANCH` relationships

No slug, sitemap, or indexability change.

---

## P. MANIFEST

Predicted writes: **public catalog 0 / slugs 0 / sitemap 0**.

Fingerprints:

- INSTITUTION `a1b7ef0aa4645b1789f10363d6d8bf1256e03552f29ed75caf315b254aee871b`
- IDENTIFIER `e1864332f5651e01501d382a92c5b6ca5db8efd1bd1faf33b4498c4b9b1d312d`
- SOURCE-LINK `9642454326325279279c20dfeb46980aeddd6087d29c895e9f64cc1dddb97fc8`
- LEGACY-BRIDGE `883890217b592d9ee663533ba41fa6460f83476b8f1b0fe1a8d4e4a8a2724e14`

File: `docs/lend-nat-002-manifest.json`

---

## Q. EXECUTION

| | |
| --- | --- |
| Executed production writes | **NO** |
| Batches | in-memory dry-run only |
| Retries | 0 |
| Failures | 0 |
| Ambiguity | left unattached (review/unresolved) |

---

## R. PRODUCTION GRAPH COUNTS

**Not in production database.** In-memory dry-run counts above are the intended first cohort.

---

## S. RECONCILIATION

| Expected | Actual | Explanation |
| --- | --- | --- |
| 1,049 catalog rows | 1,049 | match |
| 629 companies | 629 | match |
| 463 NMLS-verified | 463 | match |
| 460 institutions | 460 | 463 verified minus 1 branch minus 2 collision |
| 4,715 LEI identifiers | 4,715 | every national HMDA LEI kept |
| 246 LEI attached | 246 | 438 maps minus many-NMLS, many-LEI, name-only, unverified NMLS, quarantine |
| 438 mapped LEIs | 438 | match LEND-NAT-001 |
| 13 / 18 collision families | 13 / 18 | match |
| FDIC identifiers | 0 | name is not a cert↔NMLS key |
| Public catalog count | unchanged | fingerprint match |
| Production graph tables | 0 rows | writes blocked pending DB verification |

---

## T. TEST RESULTS

| ID | Result |
| --- | --- |
| ID1 Same NMLS, many geo rows → one institution | PASS |
| ID2 Different NMLS → different institutions | PASS |
| ID3 Branch NMLS ≠ institution NMLS | PASS |
| ID4 Person/team NMLS ≠ institution NMLS | PASS |
| ID5 Same LEI reimport → one LEI identifier | PASS |
| ID6 Name-only LEI cannot merge to NMLS | PASS |
| ID7 One LEI → many NMLS → REVIEW_REQUIRED | PASS |
| ID8 One NMLS → many LEIs preserved separately | PASS |
| ID9 Slug is not an identity key | PASS |
| ID10 Geo clone ≠ branch | PASS |
| ID11 Orphan HMDA LEI preserved | PASS |
| ID12 FDIC cert ≠ NMLS | PASS |
| ID13 Legal vs display names separate | PASS |
| ID14 No parent/sub flattening | PASS |
| ID15 Status not inferred from import | PASS |
| ID16 No public catalog mutation | PASS |
| ID17 Reimport idempotent | PASS |
| ID18 Fairway/CMG maps do not auto-merge | PASS |

**18 / 18 PASS** (`npm run assert:lend-nat-002`)

---

## U. IDEMPOTENCY

Second in-memory build: **0** new institutions / identifiers / source links / bridges. Fingerprints identical. Public writes 0.

---

## V. PUBLIC PRODUCTION IMPACT

**NONE.** `lib/mockData.ts` behavior, slugs, `/lenders`, `/local-lenders`, hubs, sitemap, robots, homepage counts were not modified.

---

## W. RISKS / BLOCKERS

1. **Production DB unverified** — cannot apply migration or backfill.  
2. 4,469 LEIs still unattached; HMDA evidence still slug-keyed in UI.  
3. Fairway company NMLS **1702** is not on a catalog row, so no Fairway institution was seeded from 2909 (correct).  
4. 63 FDIC name hits include dangerous collisions (Citizens Bank → many certs).  
5. GLEIF cache is name-only, 15.8% of LEIs.  
6. `ask-search-009-release-lender` is not identical to `origin/main`; catalog is the production-matching surface.

---

## X. NATIONAL LENDER COMPLETION SCORECARD

| Layer | Score |
| --- | --- |
| Institution identity | **PARTIAL** (460 confirmed; not in prod DB) |
| Typed identifiers | **PARTIAL** |
| NMLS identity | **PARTIAL** (institution vs branch vs person distinguished) |
| LEI identity | **PARTIAL** (4,715 identifiers) |
| LEI↔NMLS resolution | **PARTIAL** (246 CONFIRMED; 13/18 quarantined) |
| FDIC identity | PARTIAL (namespace only) |
| NCUA / RSSD / FHA / HUD / SBA | NOT STARTED (namespace ready) |
| Branch identity | NOT STARTED (1 branch ID quarantined; no HAS_BRANCH) |
| MLO identity / MLO→institution | NOT STARTED |
| State licenses | NOT STARTED |
| HMDA attribution | PARTIAL (ready for 246 LEIs; UI still slug-based) |
| HMDA intelligence | PARTIAL (unchanged summaries) |
| CFPB / enforcement / VA / SBA | unchanged |
| Provenance/freshness | PARTIAL |
| Geography | PARTIAL (clones linked, not licensed_in / originated_in) |
| National metrics | unchanged |
| Public profile readiness | unchanged |
| State intelligence readiness | BLOCKED |

---

## Y. RECOMMENDED NEXT TASK

**HMDA CANONICAL ATTRIBUTION**

The spine now has 4,715 LEI identifiers and 246 CONFIRMED institution links. Next work should attribute existing 2025 HMDA summaries to `LEI → institution` (keeping orphans) instead of expanding maps or Florida UI. Do not attach REVIEW_REQUIRED maps. Do not change the public directory.

---

## Files added (not deployed)

- `supabase/migrations/20260826120000_national_institution_identity_spine.sql`
- `lib/identity/*`
- `scripts/lend-nat-002-dry-run.ts`
- `docs/lend-nat-002-manifest.json`
- `npm run assert:lend-nat-002`
