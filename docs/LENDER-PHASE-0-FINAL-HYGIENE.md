# Phase 0 final data hygiene (2026-08)

Closing pass on LenderTrustHub directory integrity after HMDA + CFPB evidence panels shipped.

## Issues found

| Area | Finding | Fix |
|------|---------|-----|
| NMLS collisions | Synthetic/shared NMLS IDs linked **unrelated** company names (e.g. NMLS `448291` on four different “local specialist” brands; Fairway SC row used Newrez `2289`) | `resolveNmlsIdentityConflicts()` keeps NMLS on the winning company family; clears NMLS on conflicting names. Source fix: Fairway upstate `nmlsId` emptied. |
| Seed CFPB counts | Catalog `cfpbComplaints` (1–18) treated as soft Research Score signal | Sanitize zeros catalog CFPB counts (live CCDB panel is separate). |
| Seed ratings / phones / close | Already stripped by prior Phase 0 sanitize | Confirmed still clean after pass. |
| Palm Beach Mortgage Group | Empty NMLS (placeholder previously removed) | **Left incomplete** — no invented ID. |
| Branch clones | Guild / NAF / PierPoint / etc. many geo rows, same NMLS | **Intentional** branch listings; entity counts already dedupe by NMLS. |
| CFPB panel coverage | 13/36 national HMDA slugs mapped | Documented gaps — no forced matches. |
| HMDA panels | 36/36 national rows resolve | Confirmed. |

## Runtime catalog (post-fix)

- Listings vs entities: **683** listings / **~267** distinct entities (branch-aware)
- Incomplete NMLS after conflict resolve: **17** (synthetic multi-name IDs cleared + Palm Beach + Fairway SC)
- Remaining multi-core NMLS conflicts: **0**
- Placeholder phones after sanitize: **0**
- Unsourced ratings after sanitize: **0**
- Catalog CFPB counts after sanitize: **0** (panels use CCDB snapshot)
- Close metrics after sanitize: **0**
- Slug collisions: **0**
- County label vs derived home mismatches: **0**
- National HMDA panels: **36/36** resolve
- National CFPB panels: **13/36** resolve (curated matches only)

## Remaining known gaps (intentional)

1. **Palm Beach Mortgage Group** — NMLS incomplete until confirmed on NMLS Consumer Access.
2. **Fairway Independent Mortgage (Upstate)** — NMLS incomplete until a verified company ID is confirmed (no longer shares Newrez).
3. **Synthetic local “specialist” rows** — many still present as research placeholders with incomplete NMLS after conflict resolution; prefer quality backfill over inventing IDs.
4. **Branch-style multi-geo rows** for national brands — not collapsed to one URL; counts use entity dedupe; non-canonical profiles remain noindex where applicable.
5. **Seed national demo lenders** in `mockData` NATIONAL_LENDERS (Pacific Trust, etc.) — phones/ratings stripped; long-term prefer replace with verified companies.
6. **CFPB company matching** for remaining nationals (Truist, Regions, NAF, banks, CUs) — expand only with exact CFPB names.
7. **BBB grades** remain seed fields but Research Score awards **0** until independently sourced.
8. **Closing performance** remains suppressed without provenance.

## Guards

```bash
npm run check:phase0
npm run audit:phase0-catalog
```

## Success criteria status

- No obvious placeholders in production display paths (sanitize + conflict resolve)
- Fewer false entity merges from shared synthetic NMLS
- County assignments reconciled via home locality (no remaining mismatches)
- HMDA + CFPB panels still resolve for mapped majors
