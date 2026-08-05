# Network identity — Lender Trust Hub

**Goal:** One **Ask Trust Hub** account across Move, Insurance, and Lending.  
**Move is source of truth** for auth UX (magic link default + optional password + Google + Facebook).

**Production host:** `https://www.lendertrusthub.com`  
**Repo:** Lender-Trust-Hub (production only)

---

## Shared identity (required for same `auth.users` id)

Insurance and Lending Vercel projects must use the **same Supabase Auth project** as Move:

| Env | Purpose |
|-----|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Shared project URL (must match Move) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Shared anon key |
| `NEXT_PUBLIC_SITE_URL` | `https://www.lendertrusthub.com` (this host’s origin for redirects) |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional server-only (not required for OTP/OAuth session) |

Do **not** hardcode secrets in git.

---

## Auth routes (this repo)

| Path | Role |
|------|------|
| `POST /api/auth/magic-link` | Email OTP magic link (`signInWithOtp`) |
| `GET /api/auth/google` | Start Google OAuth |
| `GET /api/auth/facebook` | Start Facebook OAuth |
| `GET /auth/callback` | OAuth / code exchange → session cookie |
| `GET /auth/confirm` | Email OTP `token_hash` verify (Resend-style links) |
| `GET /api/auth/network-handoff/start` | Start silent SSO to another hub (session required) |
| `GET /auth/network-handoff` | Complete SSO — set cookies on this domain |

Post-login default: `/my-lending?auth=success`  
Errors: `/my-lending?auth=error`

---

## Client surface

| Piece | Location |
|-------|----------|
| Provider + session | `components/my-lending/my-lending-provider.tsx` |
| Auth modal (magic → Google → Facebook) | `components/my-lending/auth-modal.tsx` |
| Social buttons | `components/my-lending/social-sign-in-buttons.tsx` |
| Shell (layout) | `components/my-lending/my-lending-shell.tsx` |
| Header Sign in | `components/Navbar.tsx` |
| HQ identity strip | `components/my-lending/guest-lending-hq.tsx` |
| Constants / redirect sanitize | `lib/my-lending/auth-constants.ts` |
| Magic link helper | `lib/my-lending/request-magic-link.ts` |
| Browser client | `lib/supabase/client.ts` → `createBrowserSupabaseClient()` |

**Guest-first:** directories, calculators, and chapter HQ work without sign-in.  
**Sign-out** does not clear `lth:my-lending:v1` (local multi-plan library).  
**Cloud plan tables:** Phase 4 — not implemented; local remains source of truth.

---

## Ops checklist (human — consoles)

### Supabase Auth → URL configuration (required — human)

Shared project **arepfylnilkjmyduhwbz**. Site URL may stay Move; **Redirect URLs must include every hub** or Supabase falls back to Site URL (`movetrusthub.com/?code=…`).

Add (if missing):

```
https://www.movetrusthub.com/**
https://www.insurancetrusthub.com/**
https://www.lendertrusthub.com/**
https://www.asktrusthub.com/**
http://localhost:3000/**
```

Or explicit:

- `https://www.lendertrusthub.com/auth/callback`
- `https://www.lendertrusthub.com/auth/confirm`
- (same for insurance + move)

### App redirect rules (code) — Move bridge

Shared Supabase **Site URL** is Move. Redirects not on the allow-list fall back to Move and never set cookies on Lender.

**Default strategy** (`AUTH_OAUTH_DIRECT` unset):

1. Magic link / Google / Facebook set  
   `emailRedirectTo` / `redirectTo` =  
   `https://www.movetrusthub.com/auth/callback?next=/my-lending&hub=lending`
2. Move `/auth/callback` **does not** exchange the code; 302 to  
   `https://www.lendertrusthub.com/auth/callback?code=…&next=…&hub=lending`
3. Lender exchanges the code and sets **session cookies on lendertrusthub.com**

Set `AUTH_OAUTH_DIRECT=1` only after Redirect URLs include `https://www.lendertrusthub.com/**`.

Canonical origin (never Move): `https://www.lendertrusthub.com`

### Silent cross-domain SSO (network handoff)

Signed-in network bar / seal / journey links use one-time codes (90s, single-use, target-bound):

1. `GET /api/auth/network-handoff/start?to=…` on current hub  
2. 302 → target `/auth/network-handoff?code=…`  
3. Target: consume row → `admin.generateLink` + `verifyOtp` → cookies via `@supabase/ssr` (same as callback) → HQ  

Requires migration `20260805120000_network_auth_handoffs.sql` on shared project + `SUPABASE_SERVICE_ROLE_KEY` on each Vercel.  
Sign-out v1 = this domain only. Guests get plain URLs. See `docs/NETWORK-SSO-HANDOFF.md`.

### Google Cloud OAuth

Authorized JavaScript origins + redirect URIs for all three `www` domains (and Supabase callback host if using provider-hosted flow).

### Facebook Login

Valid OAuth redirect URIs for all three domains / Supabase Facebook redirect.

### Vercel (Lender)

- `NEXT_PUBLIC_SUPABASE_URL` = **same value as Move**
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = **same as Move**
- `NEXT_PUBLIC_SITE_URL` = `https://www.lendertrusthub.com`

---

## Phase 4 (out of scope here)

- Unified cloud tables for lending plans  
- Cross-subdomain SSO cookie tricks  
- Account deletion / data export  

---

## Move reference (audit)

| Item | Move (movetrusthub.com) |
|------|-------------------------|
| Magic link API | `app/api/auth/magic-link` |
| Google / Facebook | `app/api/auth/google`, `…/facebook` |
| Callback / confirm | `app/auth/callback`, `app/auth/confirm` |
| UX order | Magic link default; optional password; Google; Facebook |
| Env | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

See also Move `docs/SUPABASE_AUTH_EMAILS.md` for email templates and Site URL notes.

---

## Human tests

1. Guest uses `/my-lending` without account — plans persist in localStorage.  
2. Sign in (magic link or Google) → HQ shows email; same Supabase user id as Move when env is shared.  
3. Sign out → plans still on device.  
4. Core research pages have **no** login wall.  
5. Facebook smoke-test when app review allows.
