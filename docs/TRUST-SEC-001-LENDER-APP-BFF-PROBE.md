# TRUST-SEC-001 — Lender App/BFF compatibility (post Wave 0 L1)

**Hub:** LenderTrustHub (`savitz25/Lender-Trust-Hub`)  
**Date:** 2026-09-17  
**Production:** HOLD — no `merge_branch`, no prod DDL, no deploy from this probe  
**Wave 0 L1 branch (deleted after evidence):** `povquveautnhfxcohsll` (parent `hidcrbexurginnuqgipx`)  
**Do not:** restore anon/auth EXECUTE on `consume_network_auth_handoff`, weaken RLS, or invent a live pass

## STATUS: PARTIAL

Code-trace confirms Lender handoff consume is already BFF/`service_role`. Public CFPB/enforcement/depository **app** reads do not call the revoked RPC and do not depend on world-writable handoff grants. Live consume E2E against a Wave 0 branch URL was **not** run (no branch URL provided). Do not upgrade L1 to VERIFIED until the runbook below is executed against a live branch or preview that points at the remediating API.

| Gate | Result |
|------|--------|
| Call-site map | Complete (this document) |
| BFF-safe (code-trace) | Yes — no app change required to keep D1 |
| Live handoff E2E | UNKNOWN |
| Production | HOLD |
| Founder merge of Wave 0 SQL | Not this PR |

## Projects (do not mix)

| Role | Project ref | Used by |
|------|-------------|---------|
| Shared auth / SSO handoff | `arepfylnilkjmyduhwbz` (Move) | Live `NEXT_PUBLIC_SUPABASE_URL` for Lender Vercel. `network_auth_handoffs` + `consume_network_auth_handoff`. Move Wave 0 **M1** is the revoke that hits this host. |
| Lender research graph | `hidcrbexurginnuqgipx` | Ingest/admin scripts, LPI, CFPB/enforcement ledgers, `lender_intelligence_snapshots`. Wave 0 **L1** was applied here on the ephemeral branch. |

Health JSON `supabaseHost` tells you which host the **app** is calling. A Lender L1 branch URL that is **not** wired into preview env does not probe the live handoff path.

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

## 2. Probe matrix

`actual` stays **UNKNOWN** until a preview/branch URL is pointed at a Wave 0 remediating API. Do not fill PASS from code-trace.

| route/action | expected | actual | HTTP/API | role used | branch/project | regression Y/N | security contract preserved Y/N |
|--------------|----------|--------|----------|-----------|----------------|----------------|---------------------------------|
| `GET /api/auth/network-handoff/health` | 200; `ok:true`; `rpc:true`; `wave0Contract.consumeRpcServiceRoleOnly:true`; `anonRpcDenied:true` | UNKNOWN | GET JSON | service_role (success) + anon (denied) | env `supabaseHost` vs Wave 0 branch | UNKNOWN | UNKNOWN |
| `GET /auth/network-handoff` (no code) | 307 → `/my-lending?handoff=failed` (not 404) | UNKNOWN | GET redirect | none | preview host | UNKNOWN | UNKNOWN |
| `GET /auth/network-handoff?code=<valid unused>` | 307 `handoff=ok` + session cookie | UNKNOWN | GET redirect | service_role consume + anon verifyOtp | **must** be Wave 0 API for consume | UNKNOWN | UNKNOWN |
| `GET /auth/network-handoff?code=<replay>` | fail `consume_*` / expired | UNKNOWN | GET redirect | service_role | same | UNKNOWN | UNKNOWN |
| Anon PostgREST `rpc consume_network_auth_handoff` | EXECUTE denied (42501 / not found) | UNKNOWN | PostgREST | anon | Wave 0 host | UNKNOWN | UNKNOWN |
| Signed-in `POST /api/auth/network-handoff/start` | 200 `{ok, redirectUrl}` mint via service_role INSERT | UNKNOWN | POST JSON | auth session + service_role insert | Wave 0 host | UNKNOWN | UNKNOWN |
| `GET /lenders/{mapped-slug}` CFPB panel | Renders from JSON snapshot | UNKNOWN | document | none (file) | preview | UNKNOWN | Y (no DB EXECUTE) |
| `GET /lender/{national-slug}` | 200 from LPI via service_role **or** 404 if env points at a project without that row | UNKNOWN | RSC | service_role | `supabaseHost` | UNKNOWN | Y if no anon table read |
| `GET /florida` (or other state intel) | 200 from published snapshot or accepted artifact | UNKNOWN | RSC | service_role or PUBLIC_READ SELECT | research project if wired | UNKNOWN | Y if writes still SRO |
| Ingest script against research project | service_role writes still succeed | UNKNOWN | SQL/script | service_role | `hidcrbexurginnuqgipx` branch | UNKNOWN | UNKNOWN |

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

If Move preview is unavailable, record handoff E2E as **PARTIAL** (mint+health only). Do not mark VERIFIED.

### 6. Research smoke (same preview)

```bash
curl -sSI "$PREVIEW/lenders/rocket-mortgage"
curl -sSI "$PREVIEW/florida"
```

Expect 200. CFPB on directory pages does not need the branch DB. National `/lender/{slug}` needs service_role + LPI rows on **that** host — 404 is not an L1 security regression if the branch has no LPI.

### 7. Record

Copy the matrix row `actual` values from HTTP bodies. If any row is still unrun, leave UNKNOWN. **Do not write PASS.**

## 4. App changes in this PR

No BFF rewrite of consume: it already used `createAdminClient()`. This PR:

- Documents the map / matrix / runbook
- Adds `wave0Contract` diagnostics on health (does **not** change `ok` so prod monitoring stays service_role connectivity)
- Adds `npm run assert:sec001-l1` so client/anon RPC cannot land later
- Does **not** grant anon EXECUTE, alter RLS, or migrate production

## 5. Upgrade L1 PARTIAL → VERIFIED

All of:

1. Live health on a Wave 0 **branch** host with `consumeRpcServiceRoleOnly=true`
2. Anon REST RPC denied
3. At least one successful consume+session **or** documented blocker (no test user / no paired Move preview) with mint+dummy RPC still green
4. Research smokes 200 or explained 404 (missing LPI on branch, not permission panic)
5. Founder still must separately approve production DDL
