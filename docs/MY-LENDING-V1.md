# My Lending V1 — Research Workspace (Phase 3)

## Auth choice

**Guest-first localStorage** remains the default (existing `lth:my-lending:v1` store).

- Analyzer / Compare work fully **without** an account.
- “Save to My Lending” writes to the device store and attaches to the active research plan.
- Optional **magic link / Google / Facebook** via existing Supabase My Lending shell (same as prior phases) — not required for V1 saves.

Why: lowest friction for research; no lead funnel; reuses proven guest storage + optional network sign-in.

## Data model (plan-scoped)

Extended `FinancePlan` (state version **3**):

| Field | Purpose |
|-------|---------|
| `savedLoanEstimates[]` | Single LE analyses: inputs + summary + optional lender/county |
| `savedLeComparisons[]` | 2–3 offer comparisons: estimate payloads + headline callouts |
| `savedLenderIds` + `savedLenders` | Existing shortlist / researching lenders |
| `calculatorSnapshots[]` | Existing generic calculator saves |

Caps: 25 Loan Estimates, 15 comparisons per plan (localStorage-friendly).

## Reopen

`stageLeWorkspaceReopen` / `consumeLeWorkspaceReopen` (sessionStorage) deep-link:

- Saved LE → `/tools/loan-estimate-analyzer` with form restored
- Saved comparison → `/tools/compare-loan-estimates` with A/B/C restored

## UI entry points

- Analyzer: **Save to My Lending** after analysis
- Compare: **Save comparison to My Lending**
- Profiles: existing **SaveLenderButton**
- `/my-lending`: workspace sections for LEs, comparisons, lenders

## Out of scope (later)

Cloud sync of LE payloads, email nurture, PDF storage, folders, lender messaging.
