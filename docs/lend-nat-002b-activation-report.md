# LEND-NAT-002B — Production graph activation

**Status:** COMPLETE  
**Date:** 2026-08-26  
**Public impact:** NONE

---

## Database

| | |
| --- | --- |
| Provider | Supabase PostgreSQL |
| Project | `arepfylnilkjmyduhwbz` |
| Host | `arepfylnilkjmyduhwbz.supabase.co` |
| Verification | Live `/api/auth/network-handoff/health` + `/api/health/supabase` (`connected`, `lenderCount: 0`) + `docs/NETWORK-AUTH.md` |
| Secrets | not logged |

Schema applied via `DATABASE_URL` to that project. SQL Editor package remains at `docs/LEND-NAT-002B-GRAPH-SQL-EDITOR.md` for replay.

Migration: `supabase/migrations/20260826120000_national_institution_identity_spine.sql`  
SHA-256: `14117cdc8d5c98ce6c00aa2e9e9a25156950e90e42498f452b91188a42eaf7f4`  
Applied: **YES**

## Production graph counts (after apply + idempotent re-apply)

| Metric | Expected | Actual |
| --- | ---: | ---: |
| Institutions | 460 | 460 |
| Identifiers | 5,176 | 5,176 |
| NMLS_INSTITUTION | 460 | 460 |
| NMLS_BRANCH | 1 | 1 |
| NMLS_PERSON | 0 | 0 |
| LEI | 4,715 | 4,715 |
| LEI attached | 246 | 246 |
| LEI unattached | 4,469 | 4,469 |
| Source links | 5,764 | 5,764 |
| Legacy bridges | 1,049 | 1,049 |
| Identity conflicts | 39 | 39 |
| Branch entities | 0 | 0 |
| MLO entities | 0 | 0 |
| Relationships | 0 | 0 |

Second apply: `pre_counts == post_counts`. No new rows.

## Public

Live `/local-lenders`: **629** companies, **1,049** location rows, **463** NMLS-verified. Unchanged.
