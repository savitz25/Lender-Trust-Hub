# My Lending V1.1 — Research passport polish

**Superseded polish:** see [MY-LENDING-V1.2.md](./MY-LENDING-V1.2.md) for organization, notes, and save/reopen improvements.

Strengthens `/my-lending` as a lightweight research workspace. Not a CRM, lead funnel, or account-gated product.

## What changed

### 1. Organization
- Clearer section hierarchy: plan → LE research (tabs) → calculators → lenders
- Sort: newest / oldest / A–Z on Loan Estimates, comparisons, and lenders
- Tabs for Estimates vs Comparisons
- Stronger visual separation and remove actions

### 2. Private notes
- Short notes (max 500 chars) on:
  - Saved Loan Estimates
  - Saved LE comparisons
  - Saved lenders
- Easy add / edit / clear via `PrivateResearchNote`
- Research-oriented copy; not a document system

### 3. Empty states + onboarding
- “Research passport” intro strip
- Empty states with links to Analyzer, Compare, and local lenders
- First-visit plan-empty state guides setup without forcing signup

### 4. Storage: guest vs signed-in

| Mode | Behavior |
|------|----------|
| **Guest** | `localStorage` key `lth:my-lending:v1` — this device only |
| **Signed in** | Prefer `lth:my-lending:v1:user:{userId}` device cache; optional cloud blob in `my_lending_workspaces` |

Rules:
- Tools and saves never require an account
- Sign-out never deletes guest or user local caches; only switches active namespace back to guest
- First sign-in with empty user cache: **one-way seed** from guest → user key (guest left intact)
- Cloud: last-write-wins by `client_updated_at` — **no** plan-level merge UI
- If Supabase table/migration is not applied, signed-in still works with user-scoped localStorage only

Migration: `supabase/migrations/20260809120000_my_lending_workspaces.sql`

## Code map

| Area | Files |
|------|--------|
| Types / caps | `lib/my-lending/types.ts` |
| Storage + notes + identity | `lib/my-lending/storage.ts` |
| Cloud pull/push | `lib/my-lending/sync.ts` |
| Auth + identity switch | `components/my-lending/my-lending-provider.tsx` |
| HQ UI | `components/my-lending/guest-lending-hq.tsx` |
| Notes control | `components/my-lending/private-research-note.tsx` |

## Remaining limitations

- No folders / tags
- No PDF attachments or collaboration
- No sophisticated multi-device conflict resolution (whole-workspace LWW only)
- Cloud requires applying the migration on the Lender Supabase project
- Guest and signed-in libraries can diverge after seed; no automatic re-merge

## Product principles (unchanged)

Research workspace · Optional saving · No nurture email · Mobile-friendly · Calm, trustworthy copy
