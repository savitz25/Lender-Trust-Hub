'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Building2,
  Minus,
  Plus,
  Scale,
} from 'lucide-react';
import {
  COMPARE_DRAFT_STORAGE_KEY,
  COMPARE_METRICS,
  MAX_COMPARE_ESTIMATES,
  MIN_COMPARE_ESTIMATES,
  compareLoanEstimates,
  type CompareDraftPayload,
  type CompareSlotId,
} from '@/lib/tools/loan-estimate-analyzer/compare';
import { emptyLoanEstimateInputs } from '@/lib/tools/loan-estimate-analyzer/defaults';
import type { LoanEstimateInputs, LoanEstimateLoanType } from '@/lib/tools/loan-estimate-analyzer/types';
import type { AnalyzerBootstrap } from '@/lib/tools/loan-estimate-analyzer/serialize-context';
import { FredRateContextPanel } from '@/components/rates/FredRateContextPanel';
import { SaveLeComparisonButton } from '@/components/my-lending/save-le-comparison-button';
import { consumeLeWorkspaceReopen } from '@/lib/my-lending/storage';
import { cn, formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const SLOTS: CompareSlotId[] = ['A', 'B', 'C'];
const SLOT_LABELS: Record<CompareSlotId, string> = {
  A: 'Estimate A',
  B: 'Estimate B',
  C: 'Estimate C',
};

const LOAN_TYPES: { value: LoanEstimateLoanType; label: string }[] = [
  { value: 'conventional', label: 'Conventional' },
  { value: 'fha', label: 'FHA' },
  { value: 'va', label: 'VA' },
  { value: 'usda', label: 'USDA' },
  { value: 'jumbo', label: 'Jumbo' },
  { value: 'other', label: 'Other' },
];

const inputClass =
  'w-full min-h-11 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-base text-[#0A2540] outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 sm:text-sm';

function parseMoney(raw: string): number {
  const n = Number(String(raw).replace(/[,$]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function parseOptionalMoney(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  return parseMoney(t);
}

function parseRate(raw: string): number {
  const n = Number(String(raw).replace(/%/g, ''));
  return Number.isFinite(n) ? n : 0;
}

type FormState = {
  loanAmount: string;
  interestRate: string;
  apr: string;
  originationCharges: string;
  discountPoints: string;
  lenderCredits: string;
  totalClosingCosts: string;
  loanType: LoanEstimateLoanType;
  lenderSlug: string;
  countySlug: string;
  label: string;
};

function formFromInputs(inputs: LoanEstimateInputs, label: string): FormState {
  return {
    loanAmount: String(inputs.loanAmount || ''),
    interestRate: String(inputs.interestRate ?? ''),
    apr: inputs.apr == null ? '' : String(inputs.apr),
    originationCharges: String(inputs.originationCharges ?? ''),
    discountPoints: String(inputs.discountPoints ?? ''),
    lenderCredits: String(inputs.lenderCredits ?? ''),
    totalClosingCosts:
      inputs.totalClosingCosts == null ? '' : String(inputs.totalClosingCosts),
    loanType: inputs.loanType || 'conventional',
    lenderSlug: inputs.lenderSlug || '',
    countySlug: inputs.countySlug || '',
    label,
  };
}

function inputsFromForm(f: FormState): LoanEstimateInputs {
  return emptyLoanEstimateInputs({
    loanAmount: parseMoney(f.loanAmount),
    interestRate: parseRate(f.interestRate),
    apr: f.apr.trim() === '' ? null : parseRate(f.apr),
    originationCharges: parseMoney(f.originationCharges),
    discountPoints: parseMoney(f.discountPoints),
    lenderCredits: parseMoney(f.lenderCredits),
    totalClosingCosts: parseOptionalMoney(f.totalClosingCosts),
    loanType: f.loanType,
    lenderSlug: f.lenderSlug,
    countySlug: f.countySlug,
  });
}

function defaultForms(
  initial?: Partial<LoanEstimateInputs>
): Record<CompareSlotId, FormState> {
  const base = emptyLoanEstimateInputs(initial);
  const alt = emptyLoanEstimateInputs({
    ...base,
    interestRate: Math.round((base.interestRate + 0.25) * 1000) / 1000,
    apr: base.apr != null ? Math.round((base.apr + 0.2) * 1000) / 1000 : null,
    originationCharges: Math.round(base.originationCharges * 1.4),
    discountPoints: 0,
    lenderCredits: Math.max(0, Math.round(base.lenderCredits + 1000)),
    lenderSlug: '',
  });
  return {
    A: formFromInputs(base, SLOT_LABELS.A),
    B: formFromInputs(alt, SLOT_LABELS.B),
    C: formFromInputs(
      emptyLoanEstimateInputs({
        loanAmount: base.loanAmount,
        interestRate: base.interestRate - 0.125,
        apr: base.apr != null ? base.apr - 0.05 : null,
        originationCharges: Math.round(base.originationCharges * 0.9),
        discountPoints: Math.round(base.loanAmount * 0.005),
        lenderCredits: 0,
        countySlug: base.countySlug,
      }),
      SLOT_LABELS.C
    ),
  };
}

function formatCell(
  format: 'money' | 'rate' | 'pct',
  n: number | null | undefined
): string {
  if (n == null || !Number.isFinite(n)) return '—';
  if (format === 'rate') return `${n.toFixed(3)}%`;
  if (format === 'pct') return `${n.toFixed(2)}%`;
  return formatCurrency(n);
}

export function LoanEstimateCompare({
  bootstrap,
  initialA,
}: {
  bootstrap: AnalyzerBootstrap;
  /** Prefill Estimate A (from analyzer handoff or query) */
  initialA?: Partial<LoanEstimateInputs>;
}) {
  const [count, setCount] = useState(2);
  const [forms, setForms] = useState(() => defaultForms(initialA));
  const [mobileTab, setMobileTab] = useState<CompareSlotId>('A');
  const [showResults, setShowResults] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  // sessionStorage handoff from single analyzer or My Lending reopen
  useEffect(() => {
    try {
      const reopen = consumeLeWorkspaceReopen();
      if (reopen?.type === 'comparison' && reopen.estimates?.length) {
        setForms((prev) => {
          const next = { ...prev };
          reopen.estimates.forEach((est, idx) => {
            const id = SLOTS[idx];
            if (!id) return;
            next[id] = formFromInputs(
              emptyLoanEstimateInputs(est.inputs as Partial<LoanEstimateInputs>),
              est.label || SLOT_LABELS[id]
            );
          });
          return next;
        });
        setCount(Math.min(MAX_COMPARE_ESTIMATES, Math.max(2, reopen.estimates.length)));
        setShowResults(true);
        setHydrated(true);
        return;
      }

      const raw = sessionStorage.getItem(COMPARE_DRAFT_STORAGE_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as CompareDraftPayload;
        setForms((prev) => {
          const next = { ...prev };
          for (const id of SLOTS) {
            const est = draft.estimates?.[id];
            if (est) {
              next[id] = formFromInputs(
                emptyLoanEstimateInputs(est),
                draft.estimates?.[id] && prev[id].label
                  ? prev[id].label
                  : SLOT_LABELS[id]
              );
            }
          }
          if (initialA && !draft.estimates?.A) {
            next.A = formFromInputs(emptyLoanEstimateInputs(initialA), SLOT_LABELS.A);
          }
          return next;
        });
        if (draft.activeCount && draft.activeCount >= 2 && draft.activeCount <= 3) {
          setCount(draft.activeCount);
        }
        setShowResults(true);
      } else if (initialA) {
        setForms((prev) => ({
          ...prev,
          A: formFromInputs(emptyLoanEstimateInputs(initialA), SLOT_LABELS.A),
        }));
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [initialA]);

  const activeSlots = SLOTS.slice(0, count);

  const updateForm = useCallback((id: CompareSlotId, patch: Partial<FormState>) => {
    setForms((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }, []);

  const comparison = useMemo(() => {
    const estimates = activeSlots.map((id) => ({
      id,
      label: forms[id].label.trim() || SLOT_LABELS[id],
      inputs: inputsFromForm(forms[id]),
    }));
    return compareLoanEstimates(estimates);
  }, [activeSlots, forms]);

  function addEstimate() {
    setCount((c) => Math.min(MAX_COMPARE_ESTIMATES, c + 1));
    setMobileTab(count === 2 ? 'C' : 'B');
  }

  function removeEstimate() {
    setCount((c) => Math.max(MIN_COMPARE_ESTIMATES, c - 1));
    setMobileTab((t) => (t === 'C' && count === 3 ? 'B' : t));
  }

  function loadExample() {
    setForms(defaultForms({ countySlug: 'miami-dade', lenderSlug: 'rocket-mortgage' }));
    setCount(2);
    setShowResults(true);
    setMobileTab('A');
  }

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-zinc-600">
            Comparing <strong className="text-[#0A2540]">{count}</strong> Loan Estimates
            {hydrated ? '' : '…'}
          </p>
          <p className="text-xs text-zinc-500">
            Educational research only — differences are highlighted; we do not pick a “winner.”
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadExample}
            className="min-h-11 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:border-emerald-400"
          >
            Load example
          </button>
          {count < MAX_COMPARE_ESTIMATES ? (
            <button
              type="button"
              onClick={addEstimate}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-[#0A2540] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0A2540]/90"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add estimate
            </button>
          ) : null}
          {count > MIN_COMPARE_ESTIMATES ? (
            <button
              type="button"
              onClick={removeEstimate}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:border-amber-400"
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
              Remove estimate C
            </button>
          ) : null}
        </div>
      </div>

      {/* Mobile tabs for forms */}
      <div className="lg:hidden">
        <div
          role="tablist"
          aria-label="Loan Estimate to edit"
          className="flex gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-1"
        >
          {activeSlots.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={mobileTab === id}
              onClick={() => setMobileTab(id)}
              className={cn(
                'min-h-11 flex-1 rounded-lg px-2 py-2.5 text-sm font-semibold transition',
                mobileTab === id
                  ? 'bg-white text-[#0A2540] shadow-sm'
                  : 'text-zinc-600 hover:text-[#0A2540]'
              )}
            >
              {forms[id].label.trim() || SLOT_LABELS[id]}
            </button>
          ))}
        </div>
      </div>

      {/* Forms: mobile single card via tabs; desktop multi-column */}
      <div
        className={cn(
          'grid gap-4',
          count === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-2 xl:grid-cols-3'
        )}
      >
        {activeSlots.map((id) => {
          const hiddenOnMobile = mobileTab !== id;
          return (
            <div
              key={id}
              className={cn(
                'rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5',
                hiddenOnMobile && 'hidden lg:block'
              )}
            >
              <EstimateForm
                id={id}
                form={forms[id]}
                bootstrap={bootstrap}
                onChange={(patch) => updateForm(id, patch)}
              />
            </div>
          );
        })}
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setShowResults(true)}
          className="inline-flex min-h-12 w-full max-w-md items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 sm:w-auto"
        >
          Update comparison
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {showResults && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <SaveLeComparisonButton
              label={`Comparison · ${activeSlots.length} offers`}
              estimates={activeSlots.map((id) => ({
                id,
                label: forms[id].label.trim() || SLOT_LABELS[id],
                inputs: { ...inputsFromForm(forms[id]) },
              }))}
              summary={
                comparison.headlineCallouts.slice(0, 2).join(' · ') ||
                `${activeSlots.length}-offer Loan Estimate comparison`
              }
              headlineCallouts={comparison.headlineCallouts}
            />
            <Link
              href="/my-lending"
              className="text-sm font-medium text-emerald-800 underline-offset-2 hover:underline"
            >
              My Lending workspace
            </Link>
          </div>
          <ComparisonResults
            comparison={comparison}
            bootstrap={bootstrap}
            forms={forms}
            activeSlots={activeSlots}
            mobileTab={mobileTab}
            setMobileTab={setMobileTab}
          />
        </>
      )}

      <p className="text-center text-sm text-zinc-500">
        Prefer one estimate at a time?{' '}
        <Link href="/tools/loan-estimate-analyzer" className="font-medium text-[#059669] hover:underline">
          Understand your Loan Estimate
        </Link>
        <span className="mt-1 block text-xs text-zinc-400">
          Educational research only · No phone number · We show the public record. You decide.
        </span>
      </p>
    </div>
  );
}

function EstimateForm({
  id,
  form,
  bootstrap,
  onChange,
}: {
  id: CompareSlotId;
  form: FormState;
  bootstrap: AnalyzerBootstrap;
  onChange: (patch: Partial<FormState>) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Badge variant="outline" className="font-semibold">
          {id}
        </Badge>
        <span className="text-xs text-zinc-500">Loan Estimate</span>
      </div>
      <Field label="Label (optional)" htmlFor={`${id}-label`}>
        <input
          id={`${id}-label`}
          className={inputClass}
          value={form.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder={SLOT_LABELS[id]}
        />
      </Field>
      <Field label="Loan amount ($)" htmlFor={`${id}-loan`}>
        <input
          id={`${id}-loan`}
          inputMode="decimal"
          className={inputClass}
          value={form.loanAmount}
          onChange={(e) => onChange({ loanAmount: e.target.value })}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Interest rate (%)" htmlFor={`${id}-rate`}>
          <input
            id={`${id}-rate`}
            inputMode="decimal"
            className={inputClass}
            value={form.interestRate}
            onChange={(e) => onChange({ interestRate: e.target.value })}
          />
        </Field>
        <Field label="APR (%)" htmlFor={`${id}-apr`}>
          <input
            id={`${id}-apr`}
            inputMode="decimal"
            className={inputClass}
            value={form.apr}
            onChange={(e) => onChange({ apr: e.target.value })}
            placeholder="Optional"
          />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Origination ($)" htmlFor={`${id}-orig`}>
          <input
            id={`${id}-orig`}
            inputMode="decimal"
            className={inputClass}
            value={form.originationCharges}
            onChange={(e) => onChange({ originationCharges: e.target.value })}
          />
        </Field>
        <Field label="Discount points ($)" htmlFor={`${id}-pts`}>
          <input
            id={`${id}-pts`}
            inputMode="decimal"
            className={inputClass}
            value={form.discountPoints}
            onChange={(e) => onChange({ discountPoints: e.target.value })}
          />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Lender credits ($)" htmlFor={`${id}-cred`}>
          <input
            id={`${id}-cred`}
            inputMode="decimal"
            className={inputClass}
            value={form.lenderCredits}
            onChange={(e) => onChange({ lenderCredits: e.target.value })}
          />
        </Field>
        <Field label="Total closing ($)" htmlFor={`${id}-tot`}>
          <input
            id={`${id}-tot`}
            inputMode="decimal"
            className={inputClass}
            value={form.totalClosingCosts}
            onChange={(e) => onChange({ totalClosingCosts: e.target.value })}
            placeholder="Optional"
          />
        </Field>
      </div>
      <Field label="Loan type" htmlFor={`${id}-type`}>
        <select
          id={`${id}-type`}
          className={inputClass}
          value={form.loanType}
          onChange={(e) => onChange({ loanType: e.target.value as LoanEstimateLoanType })}
        >
          {LOAN_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Matched lender (optional)" htmlFor={`${id}-lender`}>
        <select
          id={`${id}-lender`}
          className={inputClass}
          value={form.lenderSlug}
          onChange={(e) => onChange({ lenderSlug: e.target.value })}
        >
          <option value="">None</option>
          {bootstrap.lenders.map((l) => (
            <option key={l.slug} value={l.slug}>
              {l.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="County market (36 product states, optional)" htmlFor={`${id}-county`}>
        <select
          id={`${id}-county`}
          className={inputClass}
          value={form.countySlug}
          onChange={(e) => onChange({ countySlug: e.target.value })}
        >
          <option value="">None</option>
          {bootstrap.counties.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-zinc-700">
        {label}
      </label>
      {children}
    </div>
  );
}

function ComparisonResults({
  comparison,
  bootstrap,
  forms,
  activeSlots,
  mobileTab,
  setMobileTab,
}: {
  comparison: ReturnType<typeof compareLoanEstimates>;
  bootstrap: AnalyzerBootstrap;
  forms: Record<CompareSlotId, FormState>;
  activeSlots: CompareSlotId[];
  mobileTab: CompareSlotId;
  setMobileTab: (id: CompareSlotId) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Headlines */}
      <section className="rounded-2xl border border-[#0A2540]/12 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold text-[#0A2540]">
          <Scale className="h-5 w-5 text-emerald-700" aria-hidden="true" />
          Key differences (not a ranking)
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          Lowest / highest callouts are per metric only. Cash-at-closing vs monthly payment trade-offs
          depend on how long you keep the loan.
        </p>
        {comparison.headlineCallouts.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {comparison.headlineCallouts.map((c) => (
              <li
                key={c}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-800"
              >
                {c}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">Enter different figures to see callouts.</p>
        )}
      </section>

      {/* Shared national rate benchmark (FRED) — not a per-offer winner */}
      <FredRateContextPanel
        benchmarks={bootstrap.mortgageBenchmarks}
        compact
      />

      {/* Desktop comparison matrix */}
      <section className="hidden lg:block" aria-labelledby="compare-matrix-heading">
        <h2 id="compare-matrix-heading" className="mb-3 text-lg font-bold text-[#0A2540]">
          Side-by-side metrics
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50">
                <th
                  scope="col"
                  className="sticky left-0 z-10 bg-zinc-50 px-4 py-3 text-left font-semibold text-zinc-600"
                >
                  Metric
                </th>
                {comparison.rows.map((r) => (
                  <th
                    key={r.id}
                    scope="col"
                    className="px-4 py-3 text-left font-semibold text-[#0A2540]"
                  >
                    {r.label}
                    {r.inputs.lenderSlug ? (
                      <span className="mt-0.5 block text-xs font-normal text-zinc-500">
                        {bootstrap.lenderContextBySlug[r.inputs.lenderSlug]?.name ||
                          r.inputs.lenderSlug}
                      </span>
                    ) : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparison.metrics.map((m) => {
                // Skip total closing if all empty
                if (
                  m.metric.key === 'totalClosingCosts' &&
                  comparison.rows.every((r) => m.values[r.id] == null)
                ) {
                  return null;
                }
                return (
                  <tr key={m.metric.key} className="border-b border-zinc-100">
                    <th
                      scope="row"
                      className="sticky left-0 z-10 bg-white px-4 py-3 text-left font-medium text-zinc-700"
                    >
                      {m.metric.label}
                    </th>
                    {comparison.rows.map((r) => {
                      const v = m.values[r.id];
                      const isBest = m.bestSlots.includes(r.id) && m.bestSlots.length < comparison.rows.length;
                      const isWorst =
                        m.worstSlots.includes(r.id) &&
                        m.worstSlots.length < comparison.rows.length &&
                        !isBest;
                      return (
                        <td
                          key={r.id}
                          className={cn(
                            'px-4 py-3 tabular-nums',
                            isBest && 'bg-emerald-50 font-semibold text-emerald-900',
                            isWorst && 'bg-amber-50/80 text-amber-950'
                          )}
                        >
                          {formatCell(m.metric.format, v)}
                          {isBest ? (
                            <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                              {m.metric.direction === 'lower_better' ? 'lower' : 'higher'}
                            </span>
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Green highlight = better on that metric alone (lower rate/fees or higher credits). Amber =
          higher cost / lower credits on that metric. Not an overall recommendation.
        </p>
      </section>

      {/* Mobile: tabbed summary cards */}
      <section className="lg:hidden" aria-labelledby="compare-mobile-heading">
        <h2 id="compare-mobile-heading" className="mb-3 text-lg font-bold text-[#0A2540]">
          Estimate snapshot
        </h2>
        <div
          role="tablist"
          aria-label="Comparison estimate"
          className="mb-3 flex gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-1"
        >
          {activeSlots.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={mobileTab === id}
              onClick={() => setMobileTab(id)}
              className={cn(
                'min-h-11 flex-1 rounded-lg px-2 py-2.5 text-sm font-semibold',
                mobileTab === id
                  ? 'bg-white text-[#0A2540] shadow-sm'
                  : 'text-zinc-600'
              )}
            >
              {forms[id].label.trim() || SLOT_LABELS[id]}
            </button>
          ))}
        </div>
        {comparison.rows
          .filter((r) => r.id === mobileTab)
          .map((r) => (
            <div
              key={r.id}
              className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
            >
              <h3 className="font-bold text-[#0A2540]">{r.label}</h3>
              {COMPARE_METRICS.map((metric) => {
                const m = comparison.metrics.find((x) => x.metric.key === metric.key)!;
                const v = m.values[r.id];
                if (metric.key === 'totalClosingCosts' && v == null) return null;
                const isBest =
                  m.bestSlots.includes(r.id) && m.bestSlots.length < comparison.rows.length;
                return (
                  <div
                    key={metric.key}
                    className={cn(
                      'flex items-start justify-between gap-3 rounded-xl border px-3 py-2.5',
                      isBest ? 'border-emerald-200 bg-emerald-50' : 'border-zinc-100 bg-zinc-50/80'
                    )}
                  >
                    <div>
                      <div className="text-xs font-medium text-zinc-500">{metric.label}</div>
                      {isBest ? (
                        <div className="text-[10px] font-semibold uppercase text-emerald-700">
                          {metric.direction === 'lower_better' ? 'Lowest of set' : 'Highest of set'}
                        </div>
                      ) : null}
                    </div>
                    <div className="text-right text-base font-semibold tabular-nums text-[#0A2540]">
                      {formatCell(metric.format, v)}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
      </section>

      {/* Difference callouts stacked */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="text-lg font-bold text-[#0A2540]">Difference callouts</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Compared to {comparison.rows[0]?.label ?? 'Estimate A'} where both values exist.
        </p>
        <ul className="mt-4 space-y-2">
          {comparison.metrics.flatMap((m) =>
            m.callouts.map((c) => (
              <li
                key={m.metric.key + c}
                className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-800"
              >
                {c}
              </li>
            ))
          )}
        </ul>
      </section>

      {/* Education */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-[#0A2540]">
          <BookOpen className="h-5 w-5 text-emerald-700" aria-hidden="true" />
          How to read these trade-offs
        </h2>
        <ul className="space-y-2 text-sm text-zinc-600">
          {comparison.educationalNotes.map((n) => (
            <li key={n} className="flex gap-2">
              <span className="text-emerald-600">•</span>
              <span>{n}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* HMDA context per estimate with lender */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-[#0A2540]">
          <Building2 className="h-5 w-5 text-teal-700" aria-hidden="true" />
          Federal market context (when selected)
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {comparison.rows.map((r) => {
            const lender = r.inputs.lenderSlug
              ? bootstrap.lenderContextBySlug[r.inputs.lenderSlug]
              : null;
            const county = r.inputs.countySlug
              ? bootstrap.countyContextBySlug[r.inputs.countySlug]
              : null;
            if (!lender && !county) {
              return (
                <div
                  key={r.id}
                  className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500"
                >
                  <strong className="text-zinc-700">{r.label}:</strong> No HMDA lender/county selected.
                </div>
              );
            }
            return (
              <div key={r.id} className="rounded-xl border border-teal-200 bg-teal-50/40 p-4 text-sm">
                <div className="font-semibold text-[#0A2540]">{r.label}</div>
                {lender ? (
                  <p className="mt-2 text-zinc-700">
                    {lender.name}:{' '}
                    <span className="tabular-nums font-medium">
                      {(
                        lender.stateOriginations ?? lender.floridaOriginations
                      )?.toLocaleString() ?? '—'}
                    </span>{' '}
                    {lender.primaryStateName || 'State'} originations ({lender.source}).{' '}
                    <Link href={lender.profileHref} className="font-medium text-[#059669] underline">
                      Profile
                    </Link>
                  </p>
                ) : null}
                {county ? (
                  <p className="mt-1 text-zinc-700">
                    {county.countyName} County: {county.originations.toLocaleString()} originations,{' '}
                    {county.denialRatePct.toFixed(1)}% denial rate.{' '}
                    <Link href={county.countyHref} className="font-medium text-[#059669] underline">
                      Market page
                    </Link>
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-zinc-500">
                  Activity context only — not a fee range for this Loan Estimate.
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Limitations */}
      <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-950">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          Limitations & disclaimers
        </h2>
        <ul className="space-y-1.5 text-xs leading-relaxed text-amber-950/90">
          {comparison.limitations.map((l) => (
            <li key={l}>• {l}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
