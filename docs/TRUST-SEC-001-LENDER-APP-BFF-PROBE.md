# TRUST-SEC-001 — Lender App/BFF compatibility (post Wave 0 L1)

**Hub:** LenderTrustHub (`savitz25/Lender-Trust-Hub`)  
**Date:** 2026-09-17  
**Production:** HOLD — no `merge_branch`, no prod DDL, no deploy from this probe  
**Live probe branch:** `putdmoclbcauvjcrwgef` / `sec001-p2-probe` (parent `hidcrbexurginnuqgipx`, branch_id `796d324b-8b3e-41aa-b164-cfd9d67ba029`)  
**API:** https://putdmoclbcauvjcrwgef.supabase.co  
**Migration:** `sec001_p2_l1_lender_revoke_handoff_rpc`  
**Do not:** restore anon/auth EXECUTE on `consume_network_auth_handoff`, weaken RLS, or invent a live pass

## STATUS: VERIFIED (L1 app/BFF compatibility)

CoS may upgrade SEC-001-P2-L1 from PARTIAL → **VERIFIED**. Wave 0 D1 (consume SERVICE_ROLE_ONLY) does not break Lender BFF. Anon/auth EXECUTE was **not** restored. Production DDL remains HOLD.

| Gate | Result |
|------|--------|
| Call-site map | Complete |
| BFF-safe (code-trace) | Yes — consume/insert already `createAdminClient()` |
| Live handoff consume on Wave 0 branch | **PASS** — `service_role` insert+consume+replay; anon HTTP 401 `42501`; authenticated SQL `42501` |
| Public research (as used by app) | **PASS** — CFPB directory JSON; Florida intel snapshot/artifact; LPI/state profiles are service_role BFF (anon LPI RLS-empty; state profiles GRANT denied) |
| Service-role ingest | **PASS** — `lender_ingest_runs` DRY_RUN insert as `service_role` (row deleted after probe) |
| Production | HOLD |
| L2 leftover (not L1) | Advisor ERROR 17 `rls_disabled_in_public` on CFPB/enforcement/depository bases — anon INSERT reached a NOT NULL check on `lender_cfpb_source_companies`. App does not write those tables. Do not treat as L1 fail; do not grant more. |

No app BFF rewrite was required. Temporary probe user / ingest row / handoff row were deleted.

## Projects

Live production `GET https://www.lendertrusthub.com/api/auth/network-handoff/health` returns `supabaseHost: hidcrbexurginnuqgipx.supabase.co` (Lender parent — **not** Move). Wave 0 L1 on this family is the consume revoke the app will see after founder prod approval.

| Role | Project ref | Used by |
|------|-------------|---------|
| Lender app + research graph | `hidcrbexurginnuqgipx` | Live Vercel health host. LPI, CFPB ledgers, snapshots, `network_auth_handoffs` on this project. |
| Wave 0 L1 probe | `putdmoclbcauvjcrwgef` | Ephemeral branch of the parent above. This document's live matrix. |
| Move shared (historical docs) | `arepfylnilkjmyduhwbz` | Not the current Lender health host. |

## 1. Call-site map

### (a) Auth handoff consume

| Step | File | Role |
|------|------|------|
| Browser start | `components/network/network-handoff-link.tsx` | Anon key **only** for `auth.getSession()`. Then `POST /api/auth/network-handoff/start` with Bearer. **No RPC.** |
| BFF start | `app/api/auth/network-handoff/start/route.ts` | Anon `getUser()` to resolve session; `createNetworkHandoff` uses **service_role** INSERT |
| Insert + rate limit | `lib/network/network-handoff.ts` | `createAdminClient()` → `network_auth_handoffs` |
| Complete | `app/auth/network-handoff/route.ts` | Server GET; `consumeNetworkHandoff` |
| Consume RPC | `lib/network/network-handoff.ts` `consumeNetworkHandoff` | **service_role** `rpc('consume_network_auth_handoff')` |
| Session cookies | complete route | Anon SSR client `verifyOtp` (Auth API, not the revoked RPC) |
| Health | `app/api/auth/network-handoff/health/route.ts` | service_role table+RPC; **diagnostic** anon RPC expected **denied** after Wave 0 |

**Browser anon vs BFF:** consume is BFF/`service_role` only. Wave 0 revoke of anon/auth EXECUTE does **not** break this path if `SUPABASE_SERVICE_ROLE_KEY` is set for the same project as the RPC.

### (b) Public lender / regulatory research reads

| Surface | Data | How the app reads | Role |
|---------|------|-------------------|------|
| Directory CFPB panels (`/lenders/[slug]`, embed) | CFPB mortgage complaints | `lib/cfpb/load.ts` JSON (`mortgage-complaints-snapshot.json`) | **No Supabase** |
| National profiles (`/lender/[slug]`) | CFPB + enforcement + depository in LPI JSON | `lib/national-profile/fetch.ts` → `lender_profile_intelligence` | **service_role** BFF (table has no anon SELECT policy) |
| Florida public profiles | State company snapshot ± LPI | `lib/florida-profile/fetch-public.ts` | **service_role** BFF |
| State intel pages (`/florida`, `/new-jersey`, …) | Curated snapshot payload (HMDA/CFPB/depository overlays) | `lib/intel-snapshots/load.ts` → `lender_intelligence_snapshots` | Server: prefer **service_role**, fallback **anon SELECT** of `published`/`superseded` only (PUBLIC_READ). Fail closed to accepted artifact. |
| Home intel | Depository/CFPB/enforcement counts | `lib/home-intel/accepted-snapshot.json` | **No live SQL** |
| Ask / specialist | CFPB catalog + identity | JSON snapshot; identity via `lib/specialist-execution/identity-store.ts` | Identity: **service_role** |

Live `lender_cfpb_complaints` / `lender_federal_enforcement_events` are **not** queried by app routes. Founder remaining UNKNOWN (“curated read OK; no anon/auth writes”) is already how the app behaves.

**Browser anon vs BFF:** public research pages are RSC/BFF. Browser does not SELECT CFPB/enforcement tables.

### (c) Service-role ingestion / admin

| Path | Role |
|------|------|
| `scripts/seed-lenders.ts` | service_role upsert `lenders` |
| FL/NJ ingest Python (`hidcrbexurginnuqgipx`) | service/postgres; tables revoke anon/auth |
| `lib/supabase/queries/leads.ts` → `POST /api/leads` | service_role INSERT |
| Identity ingest / specialist lookups | service_role |
| Snapshot **writes** (`lender_intelligence_snapshots`) | service_role only (RLS) |

Wave 0 L1 did not revoke `service_role`. Ingest stays on the intended admin path.

### Out of Wave 0 L1 (do not treat as L1 regression)

| Path | Role | Notes |
|------|------|-------|
| `my_lending_workspaces` sync | Browser **authenticated** RLS | User-owned blob; not handoff RPC |
| Auth modal password | Browser `signInWithPassword` | Auth API |
| `GET /api/health/supabase` | Anon SELECT `lenders` | Directory PUBLIC_READ; not L1 |

## 2. Probe matrix (live 2026-09-17)

Branch: `putdmoclbcauvjcrwgef` (parent `hidcrbexurginnuqgipx`). Role matrix 7/7 already matched Wave 0 forward. Function privileges: anon_exec=false, auth_exec=false, service_exec=true. Table grants on `network_auth_handoffs`: **service_role only**.

| route/action | expected | actual | HTTP/API | role used | branch/project | regression Y/N | security contract preserved Y/N |
|--------------|----------|--------|----------|-----------|----------------|----------------|---------------------------------|
| Anon REST `POST /rest/v1/rpc/consume_network_auth_handoff` | EXECUTE denied | **PASS** HTTP 401 `42501` permission denied for function | PostgREST | anon | `putdmoclbcauvjcrwgef` | N | Y |
| Authenticated SQL `consume_network_auth_handoff` | EXECUTE denied | **PASS** `ERROR 42501` | SQL `SET ROLE authenticated` | authenticated | same | N | Y |
| service_role INSERT `network_auth_handoffs` + consume unused hash | row returned (`out_user_id`) | **PASS** `out_user_id=probe`, `out_from_hub=move`, `out_destination_path=/my-lending` | SQL `SET ROLE service_role` + `auth.role()=service_role` (PostgREST-equivalent) | service_role | same | N | Y |
| service_role replay same `code_hash` | empty / already used | **PASS** `replay=[]`; `used_at` set | SQL service_role | service_role | same | N | Y |
| Anon SELECT/INSERT `network_auth_handoffs` | GRANT denied | **PASS** HTTP 401 `42501` both | PostgREST | anon | same | N | Y |
| `GET https://www.lendertrusthub.com/auth/network-handoff` (no code) | not 404; fail to HQ | **PASS** lands `/my-lending` (handoff failed, no code) | GET document | none | production host / prod API (HOLD — not Wave 0) | N | Y |
| Prod `GET /api/auth/network-handoff/health` | service_role table+RPC reachable | `ok:true`, `rpc:true`, `supabaseHost=hidcrbexurginnuqgipx.supabase.co` | GET JSON | service_role | **production parent** — Wave 0 **not** applied; not a Wave 0 pass | N | prod still pre-revoke |
| `GET /lenders/rocket-mortgage` CFPB panel | JSON snapshot, no consume RPC | **PASS** 200; “7,302” CFPB mortgage complaints from catalog file | document | none (file) | production app | N | Y |
| Anon SELECT `lender_profile_intelligence` | RLS fail-closed (app uses service_role) | **PASS** HTTP 200 `[]` (0 rows + service_role-only policy) | PostgREST | anon | probe branch (`with_data=false`) | N | Y |
| Anon SELECT `lender_state_company_profiles` | GRANT denied (app uses service_role) | **PASS** HTTP 401 `42501` | PostgREST | anon | probe branch | N | Y |
| Anon SELECT published `lender_intelligence_snapshots` | PUBLIC_READ SELECT | **PASS** HTTP 200 `[]` | PostgREST | anon | probe branch | N | Y |
| Anon INSERT `lender_intelligence_snapshots` | RLS deny writes | **PASS** HTTP 401 RLS policy violation | PostgREST | anon | probe branch | N | Y |
| `GET /florida` state intel | 200 from snapshot/artifact | **PASS** 200; OFR/HMDA/CFPB/enforcement copy from published intel | document | none/BFF artifact | production app | N | Y |
| service_role INSERT `lender_ingest_runs` | write succeeds | **PASS** id `30d70df3-…` DRY_RUN/PASSED; deleted after | SQL service_role | service_role | probe branch | N | Y |
| Anon SELECT `lender_ingest_runs` | denied | **PASS** HTTP 401 `42501` | PostgREST | anon | probe branch | N | Y |
| Anon SELECT CFPB/enforcement/FDIC bases | L2: RLS off, SELECT works | HTTP 200 `[]` (0 rows) | PostgREST | anon | probe branch | N | **N for writes** — L2 |
| Anon INSERT `lender_cfpb_source_companies` | founder: no anon writes | HTTP 400 `23502` null `raw_company_label` — insert **reached table** | PostgREST | anon | probe branch | N | **N** — L2 `rls_disabled`; out of L1; app does not use this write |

## 3. Live probe runbook (when branch URL is provided)

Do **not** run these against production IDs `arepfylnilkjmyduhwbz` / `hidcrbexurginnuqgipx` as a Wave 0 **pass**. Production is HOLD.

### 0. Wire env (preview only)

1. Recreate ephemeral Supabase branch with Wave 0 remediations (Security).
2. Set preview `NEXT_PUBLIC_SUPABASE_URL` + anon + `SUPABASE_SERVICE_ROLE_KEY` to **that** branch.
3. Confirm `GET {preview}/api/auth/network-handoff/health` → `supabaseHost` matches the branch host, not leftover prod.

Handoff D1 on the **shared** project is Move M1. If the preview still points at prod `arepfylnilkjmyduhwbz`, this is **not** a Wave 0 probe.

### 1. Health (no invented pass)

```bash
curl -sS "$PREVIEW/api/auth/network-handoff/health"
```

Record: `ok`, `supabaseHost`, `rpc`, `rpcError`, `wave0Contract.*`.

**Wave 0 pass bar:** `ok==true` AND `wave0Contract.consumeRpcServiceRoleOnly==true`.  
If `rpc==true` and `anonRpcDenied==false`, Wave 0 revoke is **not** on this host (or was rolled back). Do not re-grant anon to make a later test pass.

### 2. Complete route exists

```bash
curl -sSI "$PREVIEW/auth/network-handoff"
```

Expect redirect to HQ with `handoff=failed` (not 404).

### 3. Anon EXECUTE denied (direct API)

Use the **branch** REST URL + **anon** key only:

```bash
curl -sS "$BRANCH_URL/rest/v1/rpc/consume_network_auth_handoff" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -H "Content-Type: application/json" \
  -d '{"p_code_hash":"0000000000000000000000000000000000000000000000000000000000000000","p_to_hub":"lender"}'
```

Expect permission denied / function not exposed. **Never** paste service_role into this curl.

### 4. Service_role dummy consume still callable

Same RPC with service_role key: HTTP 200 and empty result (dummy hash). This is the BFF contract.

### 5. Optional signed-in E2E (only if test user exists on the branch)

1. Sign in on preview.  
2. `POST /api/auth/network-handoff/start` with `{ "to": "move", "next": "/my-move" }` and Bearer.  
3. Follow `redirectUrl` **on a preview of Move that shares the same branch project**, or stop after mint and consume the code via Lender complete URL.  
4. Replay the same `code` → must fail.

If Move preview is unavailable, mint+consume RPC (this run) is enough for D1. Cookie `generateLink`/`verifyOtp` was not exercised on the ephemeral Auth database (`with_data=false`); Wave 0 did not change Auth admin APIs.

### 6. Research smoke (same preview)

```bash
curl -sSI "$PREVIEW/lenders/rocket-mortgage"
curl -sSI "$PREVIEW/florida"
```

Expect 200. CFPB on directory pages does not need the branch DB. National `/lender/{slug}` needs service_role + LPI rows on **that** host — 404 is not an L1 security regression if the branch has no LPI.

Live 2026-09-17: production `/lenders/rocket-mortgage` and `/florida` both 200 (JSON / accepted intel). Branch LPI/snapshot row counts were 0.

### 7. Record

Copy the matrix row `actual` values from HTTP bodies. If any row is still unrun, leave UNKNOWN. **Do not write PASS.** Live 2026-09-17 matrix is filled above.

## 4. App changes in this PR

No BFF rewrite of consume: it already used `createAdminClient()`. This PR:

- Documents the map / matrix / runbook and **live** Wave 0 branch results
- Adds `wave0Contract` diagnostics on health (does **not** change `ok` so prod monitoring stays service_role connectivity)
- Adds `npm run assert:sec001-l1` so client/anon RPC cannot land later
- Does **not** grant anon EXECUTE, alter RLS, or migrate production

## 5. L1 PARTIAL → VERIFIED

Completed 2026-09-17 against `putdmoclbcauvjcrwgef`:

1. Anon REST RPC denied (`42501`); authenticated SQL EXECUTE denied
2. service_role insert + consume + replay empty
3. Research smokes 200 on production app surfaces the app actually uses; branch empty LPI is data, not a grant regression
4. service_role ingest insert succeeded and was deleted
5. Production DDL still requires separate founder approval — this VERIFIED is **app/BFF compatibility**, not prod migration

## 5. Upgrade L1 PARTIAL → VERIFIED

All of:

1. Live health on a Wave 0 **branch** host with `consumeRpcServiceRoleOnly=true`
2. Anon REST RPC denied
3. At least one successful consume+session **or** documented blocker (no test user / no paired Move preview) with mint+dummy RPC still green
4. Research smokes 200 or explained 404 (missing LPI on branch, not permission panic)
5. Founder still must separately approve production DDL
