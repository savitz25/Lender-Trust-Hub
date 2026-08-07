# Lender Trust Hub — GA4 ops (Phase 5)

**Stream env:** `NEXT_PUBLIC_GA4_ID` on the **Lender-Trust-Hub** Vercel project only.  
**Baseline:** `2026-08-07` · `lender-trust-hub-phase-5`  
**Globals (browser):** `__LTH_MEASUREMENT_BASELINE`, `__LTH_MEASUREMENT_LABEL`, `__LTH_HUB`

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

## Post-deploy smoke

1. Confirm GA4 Realtime on lendertrusthub.com  
2. Click NMLS link on methodology or county intelligence module  
3. Run a calculator export or match CTA  
4. Select 2 lenders on `/compare`  
5. Open a profile; save to My Lending  
6. Visit `/my-lending`  
7. Confirm baseline: `window.__LTH_MEASUREMENT_BASELINE`

## GSC

Submit **only** `https://www.lendertrusthub.com/sitemap.xml`.
