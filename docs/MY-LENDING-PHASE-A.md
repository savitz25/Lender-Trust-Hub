# My Lending Phase A — Guest-first HQ + data model

**Production:** Lender-Trust-Hub only (`www.lendertrusthub.com`)  
**Not** Move monorepo `app/lender/*`.

## Goal

Same Phase A bar as My Insurance: guest-first HQ, durable local model, save-from-profile. Research-only; NMLS verification on primary sources. No lead-gen / pre-approval funnel.

## Storage

| Key | Value |
|-----|--------|
| **localStorage** | `lth:my-lending:v1` |
| **Event** | `lth-my-lending-store` |

```ts
MyLendingState {
  version: 1;
  activePlanId: string | null;
  plans: FinancePlan[];
  savedLenders: SavedLender[];
}
```

### Types

- `FinancePlan` — label, loanFocus[], location, notes, status, savedLenderIds  
- `SavedLender` — lenderSlug, lenderName, profilePath, nmlsId, status (`researching | shortlisted | reached_out | done`)  

### Helpers (`lib/my-lending/storage.ts`)

`loadState`, `saveState`, `upsertPlan`, `archivePlan`, `upsertSavedLender`, `removeSavedLender`, `listActivePlans`, `getActivePlan`, `ensureActivePlan`, `updateSavedLenderStatus`, `isLenderSaved`

SSR-safe; soft-fail on quota.

## Routes / UI

| Path | Role |
|------|------|
| `/my-lending` | Guest HQ — plan + saved lenders |
| `/lenders/[slug]` | **Save to My Lending** button |

Default plan on first save: **My financing research**. Default save status: **shortlisted**.

## Copy rules

- Research only · Not an endorsement  
- Not a lender or broker  
- Verify on [NMLS Consumer Access](https://www.nmlsconsumeraccess.org/)  
- Trust Mark present on HQ  

## Out of scope (later)

- Phase B: shortlist cap, directory save  
- Phase C: guided setup, snapshots, report  
- Phase D: multi-plan library  
- Auth/cloud merge  

## Human tests

1. Signed out → `/my-lending` (empty shortlist / editable plan)  
2. Create/save plan (label + loan focus required)  
3. Open lender profile → Save to My Lending → HQ lists lender  
4. Hard refresh → persists  
5. Change status → remove → gone  

## Files

- `lib/my-lending/types.ts`  
- `lib/my-lending/storage.ts`  
- `components/my-lending/guest-lending-hq.tsx`  
- `components/my-lending/save-lender-button.tsx`  
- `app/my-lending/page.tsx`  
- Navbar + Footer links  
