# LEND-NAT-012 — National public lender profile intelligence UI

**Status:** COMPLETE WITH BLOCKERS  
**Date:** 2026-08-27  
**HEAD:** `5310c4b591ee6875700c64e4bbd2fc3e0202b6bf` (uncommitted 004–012)  
**Public indexation:** NOINDEX. Sitemap: not added.  
**Publication gate:** preview cohort only (10 institutions).

Route: `/lender/{slug}` (singular). Catalog clones remain at `/lenders/{slug}`.

Legacy Next/Vercel redirects `/lender/:path* → /:path*` were removed so this route can exist.

Contract: `lend-nat-011-v1` via `lender_profile_intelligence` PK lookup (service-role) with gated fixture fallback from `docs/lend-nat-011-cohort.json`.
