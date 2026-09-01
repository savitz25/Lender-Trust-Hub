# LenderTrustHub specialist execution V2 readiness

Audit date: 2026-09-01  
Repository: `savitz25/Lender-Trust-Hub`  
Audited `origin/main`: `3f859953bd6962ff85db26735a3b93f47904c270`  
Production deployment: `dpl_2qWBhtTHM6R1iJ2NQjz8SNpn7zKt` (`READY`, same Git SHA)  
Current endpoint/contract: `GET /api/ask`, `lender-ask-v1`

This is a read-only capability audit. It authorizes no ingestion, identity creation,
publication expansion, or AskTrustHub change.

## Executive classification

| Capability | Classification | Reason |
| --- | --- | --- |
| HMDA lender market cohorts | `SMALL_ADAPTER_REQUIRED` | Florida and supported county/state property-geography cohorts already return bounded LEI rows, counts, filters, provenance, and pagination. They need V2 normalization and neutral cohort semantics. |
| Exact institution identifiers | `MATERIAL_CAPABILITY_WORK_REQUIRED` | Canonical LEI/NMLS assets exist, but `/api/ask` currently fails closed for labeled LEI and NMLS queries. |
| Institution public destinations | `SMALL_ADAPTER_REQUIRED` | Exact accepted LEI-to-profile links already appear inside HMDA rows, but identifier execution and V2 destination templates are absent. |
| Branch and MLO execution | `PROHIBITED_BY_PUBLICATION_GATE` | Branch is not institution and MLO is not institution. Current accepted policy does not authorize public MLO/branch execution rows or profiles. |
| Named-lender complaint evidence | `MATERIAL_CAPABILITY_WORK_REQUIRED` | V1 supports aggregate/ordered CFPB complaint coverage, but a named-lender question does not execute an exact identity-bound complaint result. |
| Lender headquarters/service-territory cohorts | `BLOCKED_BY_MISSING_DATA` for the HMDA execution path | HMDA property geography cannot answer lender headquarters or service territory. |

## V2 field matrix

| V2 field | Status | Current evidence / gap |
| --- | --- | --- |
| Structured requests | `ALREADY_SUPPORTED` for HMDA/count/comparison/evidence intents | Deterministic parser and query executor exist. Generic state/location and identifier intents remain incomplete. |
| Entity classes | `SUPPORTED_BUT_NOT_NORMALIZED` | Results are institution/LEI grain; explicit institution/branch/MLO capability declarations are absent. |
| Identifiers | `NOT_SUPPORTED` in `/api/ask` | Labeled NMLS and LEI goldens fail closed even though exact-key identity assets exist elsewhere. |
| Required slots | `SUPPORTED_BUT_NOT_NORMALIZED` | Geography, action, and loan type are parsed but not exposed as V2 slot requirements. |
| Geography | `ALREADY_SUPPORTED` for HMDA property state/county grain; `NOT_SUPPORTED` for institution HQ/service territory | The source meaning is explicit and must remain so. |
| Actual bounded rows | `ALREADY_SUPPORTED` | Page size 25; HMDA rows are LEI-grain with public link only after exact identity/publication checks. |
| Totals | `ALREADY_SUPPORTED` | `totalRows`, denominator facts, and exact grain are returned. |
| Pagination | `ALREADY_SUPPORTED` | Page, page size, page count, deterministic rank offset. |
| Refinements | `SUPPORTED_BUT_NOT_NORMALIZED` | Action, FHA/VA/USDA/conventional, and supported geography chips exist but not V2 `availableRefinements`. |
| Provenance | `ALREADY_SUPPORTED` | Source files, method, indexes, identity policy, publication gate, grain, period, and caveats are returned. |
| Source clocks | `SUPPORTED_BUT_NOT_NORMALIZED` | HMDA vintage `2025` is explicit; a normalized row-level/source retrieval clock is not consistently exposed. |
| Limitations | `ALREADY_SUPPORTED` | Property geography, identity, publication, complaint, and missing-field caveats are explicit. |
| Structured unsupported response | `SUPPORTED_BUT_NOT_NORMALIZED` | Deterministic `fail_closed` plus kind exists, but status classes such as invalid/unsupported/backend unavailable/timeout are not normalized. |
| Canonical destinations | `SUPPORTED_BUT_NOT_NORMALIZED` | Accepted LEI matches can return `/lender/...`; exact identifier destination execution is missing. |
| Public-only filtering | `ALREADY_SUPPORTED` for profile links | Unpublished HMDA LEIs remain research rows without public profile links. Name-only identity attachment is prohibited. |

## Production golden queries

| Query | Safe outcome observed | Classification |
| --- | --- | --- |
| `lenders in Texas` | Structured unsupported/fail-closed. V1 does not guess whether “in” means property market, HQ, branch, or service territory. | `CLARIFICATION` / `UNSUPPORTED` |
| `mortgage lenders in Florida` | `lender-location` fail-closed because the phrase does not establish HMDA property geography. | `CLARIFICATION` |
| `Which lenders originated the most FHA mortgages in Broward County?` | 25 bounded rows, 214 total, HMDA 2025 county LEI property-geography grain; first accepted profile link is present. | `ROWS` |
| exact NMLS | Current endpoint fails closed. | `UNSUPPORTED` pending exact-key executor |
| exact LEI | Current endpoint fails closed. | `UNSUPPORTED` pending exact-key executor |
| `complaints about Rocket Mortgage` | General indexed CFPB complaint evidence response, not an exact identity-bound lender result. | `HANDOFF` / capability work required |

## Existing executable cohort value

- Florida and supported county HMDA market cohorts execute at reporting-LEI grain.
- Source-native refinements include action and FHA/VA/USDA/conventional product type.
- HMDA property geography is labeled as property geography, never lender location.
- Raw-volume ordering is described as volume, not recommendation; it must not become a
  V2 quality ranking. A V2 adapter should expose neutral pagination or explicitly label
  source-native volume ordering as a requested metric.
- Complaint observations are not findings of wrongdoing and are not size-normalized.

## Publication and identity firewalls

- Institution is not branch and is not MLO.
- Exact LEI is the HMDA identity grain. NMLS is attached only where an accepted exact
  identity asset supports it.
- Name-only profile attachment is prohibited.
- HMDA application is not origination.
- HMDA property location is not institution headquarters, branch location, or service territory.
- Sponsorship is not ownership or publication eligibility.
- MLO and branch public publication restrictions remain unchanged.
- Public profile links remain gated to the accepted cohort; research rows do not mint profiles.

## Recommended implementation tickets

1. `LEND-CAP-001 — LenderTrustHub HMDA specialist execution V2 adapter`
   Normalize the existing market-cohort executor, geography meaning, refinements,
   pagination, provenance, public destinations, and structured statuses. Estimated
   size: small-to-medium (3–5 focused engineering days).
2. `LEND-CAP-002 — Exact NMLS/LEI institution execution + named complaint evidence`
   Add exact-key identifier execution over accepted identity assets and exact
   identity-bound complaint evidence. Preserve publication gates and do not expose
   branches/MLOs. Estimated size: material (5–8 focused engineering days).

No new dataset is required for the first adapter. Headquarters/service-territory
questions require a separately accepted source and are not part of these tickets.

## Safety result

DB writes: `0`  
Identity delta: `0`  
Public profile delta: `0`  
Sitemap delta: `0`  
AskTrustHub changes: `0`
