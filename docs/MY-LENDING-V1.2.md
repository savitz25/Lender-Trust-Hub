# My Lending V1.2 — Everyday research passport polish

Strengthens `/my-lending` as a practical research workspace without CRM, folders, lead routing, or forced accounts.

## What changed

### 1. Organization & scanability
- Jump nav (“On this page”) to Plan · LEs · Compares · Lenders
- Clearer visual separation: color rail + type badges (Loan Estimate / Comparison / Lender)
- Sort (newest / oldest / A–Z) retained
- Lightweight filter: **All items** vs **With notes**
- Two-step remove confirm on LEs, comparisons, and lenders
- Primary “Reopen” / “Open profile” actions more prominent

### 2. Notes usability
- Private notes more visible (bordered empty state, amber treatment when filled)
- Clearer empty prompts per item type
- Character counter, Save / Clear / Close, “Note saved” flash
- Plan notes called out as private high-level context (item notes stay on cards)

### 3. Save → reopen friction
- Shared `WorkspaceSaveToast` after save: confirmation, Open My Lending, Keep researching
- Save button labels: “Save to My Lending” / “Save comparison to My Lending”
- Analyzer & Compare show a **Loaded from My Lending** banner when reopened
- Misleading “Save your research” links that only navigated to HQ now say **Open My Lending**

### 4. Empty states & first-time guidance
- Stronger empty-library path with 3 research steps
- Direct paths: Analyzer, Compare, local lenders, Program Finder, guided setup
- Quick strip when plan exists but no research yet

### 5. Light discovery
- Footer Research column already includes My Lending
- Program Finder / Programs CTA / LE tools CTAs / lender profile tools point calmly to workspace
- Navbar My Lending control unchanged (badge when items saved)

## Code map (additions / focus)

| Area | Files |
|------|--------|
| HQ UI | `components/my-lending/guest-lending-hq.tsx` |
| Notes | `components/my-lending/private-research-note.tsx` |
| Save toast | `components/my-lending/workspace-save-toast.tsx` |
| Remove confirm | `components/my-lending/remove-confirm-button.tsx` |
| Save buttons | `save-loan-estimate-button.tsx`, `save-le-comparison-button.tsx`, `save-lender-button.tsx`, `save-calculator-snapshot-button.tsx` |
| Reopen banners | `LoanEstimateAnalyzer.tsx`, `LoanEstimateCompare.tsx` |

## Remaining limitations (intentional)

- No folders / tags / PDF attachments
- No collaboration or nurture email
- No complex multi-device merge UI (signed-in LWW foundation only)
- Guest library is this device only
- Save does not update an existing LE in place (new save = new item; reopen edits and re-save creates another save)

## Product principles (unchanged)

Research workspace · Optional saving · Guest-first · No lead funnel · Mobile-friendly · Quality over sprawl
