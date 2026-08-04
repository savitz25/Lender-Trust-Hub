# My Lending Phase D — Multi-plan library

**Production:** Lender-Trust-Hub only (`www.lendertrusthub.com`)  
**Storage:** `lth:my-lending:v1` (in-place `version: 1 | 2` migration; no data drop)

## Model

- Many `FinancePlan`s; exactly one preferred **`activePlanId`**
- Shortlist cap **3 per active plan** (not global)
- `SavedLender.planId` + `CalculatorSnapshot.planId` scoped
- Migration: backfill null `planId` → active/fallback plan

### Helpers

`listAllPlans` / `listPlans` · `getActivePlan` · `setActivePlan` · `createPlan` · `renamePlan` · `archivePlan` · `deletePlan` · `duplicatePlan` · `getPlanStats` · `getPlanById`

Creating a plan **does not** archive siblings (Phase A did).

## Routes

| Path | Role |
|------|------|
| `/my-lending/plans` | Library — Open, Report, Rename, Duplicate, Archive, Delete |
| `/my-lending` | HQ for **active** plan + switcher + **All plans** chip |
| `/my-lending/setup` | Update current **or** Create as new |
| `/my-lending/report?planId=` | Report for active or deep-linked plan |

## Scoping

| Surface | Behavior |
|---------|----------|
| HQ | Active plan lenders + snapshots only |
| Directory/profile save | Active plan; cap 3 on that plan |
| Badge | Active plan shortlisted count |
| Switch plan | Does **not** merge shortlists across plans |

## Auth note

Guest local only. Future sign-in must **not** wipe multi-plan local state.

## Human tests

1. Setup plan A → shortlist 2  
2. Setup → **Create as new** plan B → shortlist 1  
3. Library shows both; Open A → 2; Open B → 1  
4. Rename / archive / delete (confirm)  
5. Report `?planId=` + hard refresh  

## Files

- `lib/my-lending/storage.ts`, `types.ts`  
- `components/my-lending/plans-library.tsx`  
- `app/my-lending/plans/page.tsx`  
- HQ, setup, report updates  
