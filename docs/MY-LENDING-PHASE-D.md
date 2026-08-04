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

## D.4 Empty / edge states

| Case | Behavior |
|------|----------|
| Zero plans | Library CTA → Setup; HQ does **not** auto-spawn a plan |
| Archive active | `activePlanId` → most recently updated non-archived |
| Delete last plan | Clean empty HQ until Setup / Save creates one |

## Acceptance

- [x] ≥2 non-archived plans; switch via library  
- [x] Shortlist plan-scoped (A ≠ B)  
- [x] Cap 3 per plan  
- [x] Rename / archive / delete (confirm)  
- [x] Report active or `?planId=`  
- [x] Guest refresh keeps all plans  
- [x] HQ + `/my-lending/plans` linked  
- [x] Docs + SHA  

## Human tests

1. Plan A → shortlist 2  
2. New Plan B → shortlist 1  
3. Switch A → 2 / B → 1  
4. Rename B; archive A; delete a duplicate  
5. Report for active plan  
6. Hard refresh → both plans remain  

## Files

- `lib/my-lending/storage.ts`, `types.ts`  
- `components/my-lending/plans-library.tsx`  
- `app/my-lending/plans/page.tsx`  
- HQ, setup, report updates  
