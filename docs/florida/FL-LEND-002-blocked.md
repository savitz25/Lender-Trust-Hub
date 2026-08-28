# FL-LEND-002 — blocked before Production attach

**Status:** BLOCKED. Source-side dry-run completed. No Production write.

## Why this reuses the national graph

`origin/main` (`393d7ad`) has only listing-schema migrations (`public.lenders` grain). The canonical institution graph lives on `origin/intel-004-lender-national-home`:

- `lender_national_entities` (institution | branch | person_mlo)
- `lender_identifiers` (NMLS_INSTITUTION / BRANCH / PERSON, LEI, FDIC_CERT, NCUA_CHARTER, RSSD, …)
- `lender_profile_intelligence` (8,447 internal snapshots historically)
- Florida company profiles, MLO/branch identity, ASSOCIATED_WITH / BELONGS_TO, contacts

This branch is cut from that line. Additive tables (`lender_state_license_observations`, `lender_source_identity_resolutions`) attach credentials; they do not replace the spine and do not mint unmatched NMLS values as institutions.

## Blocker

Production target remains `hidcrbexurginnuqgipx`. This host has no `TARGET_DATABASE_URL` / `.env.local` for that project. Sibling hub env files are Move (`arepfyl…`), Investor (`ghjhcx…`), and Contractor (`jhjztn…`) and must not be written.

Live `https://www.lendertrusthub.com/lender` is the intel-004 national research surface, so the graph is believed present in Production — but it cannot be opened, counted, or mutated from here.

## Policy already encoded in `scripts/fl-lend-002-ingest.py`

- Company NMLS universe = 10,216 (monthly MLD ∪ monthly MBR ∪ NMLS roster company ids).
- Unmatched → `UNRESOLVED_SOURCE_COMPANY_NMLS` identifier holds (`entity_id` NULL). `NET_NEW_CONFIRMED` = 0.
- Servicer classes `MLS` / `MLSB` stay distinct from MLD / MLDB.
- Person contacts `internal_only`, never `public_candidate`.
- Monthly full-status clock and NMLS active-oriented clock stay separate.

Resume: set `TARGET_DATABASE_URL` for hidcrbex only, then `--dry-run` then `--apply` twice.
