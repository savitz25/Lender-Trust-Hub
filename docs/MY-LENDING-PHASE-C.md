# My Lending Phase C — Guided setup + calculator snapshots + report-ready

**Production:** Lender-Trust-Hub only (`www.lendertrusthub.com`)  
**Storage key:** `lth:my-lending:v1` (snapshots live on `FinancePlan.calculatorSnapshots`)

## Routes

| Path | Role |
|------|------|
| `/my-lending/setup` | Guided plan setup (Focus → Where → Situation → Review) |
| `/my-lending/report` | Report-ready takeaway (copy / print / mailto) |
| `/my-lending` | HQ chips: **Setup · Report · Calculators** + snapshot strip |

## Calculator snapshots

```ts
CalculatorSnapshot {
  id, planId, toolId, title, summary,
  inputs, outputs, href?, savedAt
}
```

- Helpers: `addCalculatorSnapshot`, `getCalculatorSnapshots`, `removeCalculatorSnapshot`  
- Same `toolId` replaces prior snapshot (max 12 per plan)  
- **PITI** (`/calculators#payment`) and **HELOC** support **Save snapshot to My Lending** via `CalcShell.snapshot`  

## Report

- Plan + shortlist (≤3) + verification checklist + snapshots  
- Actions: copy summary, print, `mailto:` prefilled body  
- Empty honest state → setup / directory / calculators  

## Cap unchanged

Shortlist max **3** (Phase B). Setup **updates active plan** without wiping shortlist.

## Human tests

1. Setup plan (label + loan focus + ZIP)  
2. Shortlist 1–2 lenders  
3. Calculators → Payment PITI → Save snapshot → HQ strip / report  
4. Report → copy / print  
5. Hard refresh → data remains  
6. Header stays light (no black chrome regression)  

## Files

- `lib/my-lending/types.ts`, `storage.ts`  
- `components/my-lending/guided-plan-setup.tsx`, `coverage-report.tsx`, `save-calculator-snapshot-button.tsx`  
- `app/my-lending/setup/page.tsx`, `report/page.tsx`  
- `components/calculators/shared/CalcShell.tsx`, `MortgagePaymentPITI.tsx`, `HELOCCalc.tsx`  
- `guest-lending-hq.tsx` chips + snapshot strip  
