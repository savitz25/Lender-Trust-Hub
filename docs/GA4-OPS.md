# Lender Trust Hub — measurement notes (Phase 5)

The Google tag loader has been removed. Do not set a measurement ID and do not add a tag script.  
**Baseline:** `2026-08-07` · `lender-trust-hub-phase-5`

## Priority custom events

| Event | Description |
|-------|-------------|
| `nmls_verification_lookup` | Outbound NMLS Consumer Access |
| `outbound_nmls_consumer_access` | Alias for NMLS outs |
| `calculator_complete` | Calculator completion path |
| `lender_compare_session` | Compare with 2+ companies |
| `my_lending_save` | Save lender to My Lending |
| `my_lending_return` | Open My Lending (once / session) |
| `lender_profile_view` | Profile view (once / slug / session) |
| `research_path_click` | Key internal research paths |
| `outbound_specialist_hub` | Cross-hub to Insurance / Move / Ask |
| `outbound_primary_source` | Official source outbound |

## GSC

Submit **only** `https://www.lendertrusthub.com/sitemap.xml`.
