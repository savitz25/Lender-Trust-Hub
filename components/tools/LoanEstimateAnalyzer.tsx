'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Building2,
  CheckCircle2,
  Info,
  MapPin,
  Scale,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { analyzeLoanEstimateClient } from '@/lib/tools/loan-estimate-analyzer/client-analyze';
import { emptyLoanEstimateInputs } from '@/lib/tools/loan-estimate-analyzer/defaults';
import {
  COMPARE_DRAFT_STORAGE_KEY,
  type CompareDraftPayload,
} from '@/lib/tools/loan-estimate-analyzer/compare';
import type {
  FeeBandLevel,
  HmdaAnalyzerCountyContext,
  HmdaAnalyzerLenderContext,
  LoanEstimateLoanType,
} from '@/lib/tools/loan-estimate-analyzer/types';
import type { AnalyzerBootstrap } from '@/lib/tools/loan-estimate-analyzer/serialize-context';
import { formatCurrency, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const LOAN_TYPES: { value: LoanEstimateLoanType; label: string }[] = [
  { value: 'conventional', label: 'Conventional' },
  { value: 'fha', label: 'FHA' },
  { value: 'va', label: 'VA' },
  { value: 'usda', label: 'USDA' },
  { value: 'jumbo', label: 'Jumbo' },
  { value: 'other', label: 'Other / not sure' },
];

function bandStyles(level: FeeBandLevel): string {
  switch (level) {
    case 'lower':
      return 'border-emerald-200 bg-emerald-50 text-emerald-900';
    case 'typical':
      return 'border-sky-200 bg-sky-50 text-sky-900';
    case 'higher':
      return 'border-amber-200 bg-amber-50 text-amber-950';
    default:
      return 'border-zinc-200 bg-zinc-50 text-zinc-700';
  }
}

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

export function LoanEstimateAnalyzer({
  bootstrap,
  initialLenderSlug = '',
  initialCountySlug = '',
}: {
  bootstrap: AnalyzerBootstrap;
  initialLenderSlug?: string;
  initialCountySlug?: string;
}) {
  const router = useRouter();
  const [loanAmount, setLoanAmount] = useState('350000');
  const [interestRate, setInterestRate] = useState('6.5');
  const [apr, setApr] = useState('6.75');
  const [originationCharges, setOriginationCharges] = useState('3500');
  const [discountPoints, setDiscountPoints] = useState('0');
  const [lenderCredits, setLenderCredits] = useState('0');
  const [totalClosingCosts, setTotalClosingCosts] = useState('');
  const [loanType, setLoanType] = useState<LoanEstimateLoanType>('conventional');
  const [lenderSlug, setLenderSlug] = useState(initialLenderSlug);
  const [countySlug, setCountySlug] = useState(initialCountySlug);
  const [submitted, setSubmitted] = useState(
    Boolean(initialLenderSlug || initialCountySlug)
  );

  const inputs = useMemo(
    () =>
      emptyLoanEstimateInputs({
        loanAmount: parseMoney(loanAmount),
        interestRate: parseRate(interestRate),
        apr: apr.trim() === '' ? null : parseRate(apr),
        originationCharges: parseMoney(originationCharges),
        discountPoints: parseMoney(discountPoints),
        lenderCredits: parseMoney(lenderCredits),
        totalClosingCosts: parseOptionalMoney(totalClosingCosts),
        loanType,
        lenderSlug,
        countySlug,
      }),
    [
      loanAmount,
      interestRate,
      apr,
      originationCharges,
      discountPoints,
      lenderCredits,
      totalClosingCosts,
      loanType,
      lenderSlug,
      countySlug,
    ]
  );

  const hmdaLender: HmdaAnalyzerLenderContext | null = lenderSlug
    ? bootstrap.lenderContextBySlug[lenderSlug] ?? null
    : null;
  const hmdaCounty: HmdaAnalyzerCountyContext | null = countySlug
    ? bootstrap.countyContextBySlug[countySlug] ?? null
    : null;

  const analysis = useMemo(
    () => analyzeLoanEstimateClient(inputs, hmdaLender, hmdaCounty),
    [inputs, hmdaLender, hmdaCounty]
  );

  function applyPreset() {
    setLoanAmount('400000');
    setInterestRate('6.375');
    setApr('6.62');
    setOriginationCharges('2995');
    setDiscountPoints('2000');
    setLenderCredits('500');
    setTotalClosingCosts('12500');
    setLoanType('conventional');
    if (!lenderSlug && bootstrap.lenders[0]) setLenderSlug(bootstrap.lenders[0].slug);
    if (!countySlug) setCountySlug('miami-dade');
    setSubmitted(true);
  }

  function goToCompare() {
    try {
      const draft: CompareDraftPayload = {
        fromAnalyzer: true,
        activeCount: 2,
        estimates: {
          A: inputs,
        },
      };
      sessionStorage.setItem(COMPARE_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      /* private mode */
    }
    const q = new URLSearchParams();
    if (inputs.lenderSlug) q.set('lender', inputs.lenderSlug);
    if (inputs.countySlug) q.set('county', inputs.countySlug);
    q.set('loanAmount', String(inputs.loanAmount));
    q.set('rate', String(inputs.interestRate));
    if (inputs.apr != null) q.set('apr', String(inputs.apr));
    q.set('origination', String(inputs.originationCharges));
    q.set('points', String(inputs.discountPoints));
    q.set('credits', String(inputs.lenderCredits));
    router.push(`/tools/compare-loan-estimates?${q.toString()}`);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Inputs */}
      <section
        aria-labelledby="le-form-heading"
        className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6"
      >
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="le-form-heading" className="text-lg font-bold text-[#0A2540]">
              Enter Loan Estimate figures
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Use Section A origination charges, discount points, and lender credits from your LE.
              No account or phone number required.
            </p>
          </div>
          <button
            type="button"
            onClick={applyPreset}
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:border-emerald-400"
          >
            Load example
          </button>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
        >
          <Field label="Loan amount ($)" htmlFor="le-loan">
            <input
              id="le-loan"
              inputMode="decimal"
              className={inputClass}
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              required
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Interest rate (%)" htmlFor="le-rate">
              <input
                id="le-rate"
                inputMode="decimal"
                className={inputClass}
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                required
              />
            </Field>
            <Field label="APR (%) — optional" htmlFor="le-apr">
              <input
                id="le-apr"
                inputMode="decimal"
                className={inputClass}
                value={apr}
                onChange={(e) => setApr(e.target.value)}
                placeholder="From Loan Estimate"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Origination charges ($)" htmlFor="le-orig">
              <input
                id="le-orig"
                inputMode="decimal"
                className={inputClass}
                value={originationCharges}
                onChange={(e) => setOriginationCharges(e.target.value)}
                required
              />
            </Field>
            <Field label="Discount points paid ($)" htmlFor="le-points">
              <input
                id="le-points"
                inputMode="decimal"
                className={inputClass}
                value={discountPoints}
                onChange={(e) => setDiscountPoints(e.target.value)}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Lender credits ($)" htmlFor="le-credits">
              <input
                id="le-credits"
                inputMode="decimal"
                className={inputClass}
                value={lenderCredits}
                onChange={(e) => setLenderCredits(e.target.value)}
              />
            </Field>
            <Field label="Total closing costs ($) — optional" htmlFor="le-total">
              <input
                id="le-total"
                inputMode="decimal"
                className={inputClass}
                value={totalClosingCosts}
                onChange={(e) => setTotalClosingCosts(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Loan type" htmlFor="le-type">
            <select
              id="le-type"
              className={inputClass}
              value={loanType}
              onChange={(e) => setLoanType(e.target.value as LoanEstimateLoanType)}
            >
              {LOAN_TYPES.map((t) => (
                <option key={t.value || 'x'} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Lender (HMDA-matched, optional)"
            htmlFor="le-lender"
            hint="Selecting a matched lender adds 2025 Florida federal activity context — not a fee percentile."
          >
            <select
              id="le-lender"
              className={inputClass}
              value={lenderSlug}
              onChange={(e) => setLenderSlug(e.target.value)}
            >
              <option value="">No lender selected</option>
              {bootstrap.lenders.map((l) => (
                <option key={l.slug} value={l.slug}>
                  {l.name}
                  {l.floridaOriginations
                    ? ` · ${l.floridaOriginations.toLocaleString()} FL orig.`
                    : ''}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Florida county (optional)"
            htmlFor="le-county"
            hint="Major Florida counties with 2025 HMDA market summaries."
          >
            <select
              id="le-county"
              className={inputClass}
              value={countySlug}
              onChange={(e) => setCountySlug(e.target.value)}
            >
              <option value="">No county selected</option>
              {bootstrap.counties.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name} County · {c.originations.toLocaleString()} orig.
                </option>
              ))}
            </select>
          </Field>

          <button
            type="submit"
            className="inline-flex w-full min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0A2540] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0A2540]/90"
          >
            Analyze Loan Estimate
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={goToCompare}
            className="inline-flex w-full min-h-12 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-[#0A2540] hover:border-emerald-400"
          >
            Compare with another Loan Estimate
          </button>
        </form>
      </section>

      {/* Results */}
      <section aria-labelledby="le-results-heading" className="space-y-4">
        <div className="rounded-2xl border border-[#0A2540]/15 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 p-5 shadow-sm md:p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
            Educational research · Not financial advice
          </p>
          <h2 id="le-results-heading" className="mt-1 text-xl font-bold text-[#0A2540]">
            {submitted ? 'Your Loan Estimate snapshot' : 'Results appear here'}
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            {submitted
              ? 'Fee placement uses published educational bands. Federal data (when selected) is 2025 HMDA volume and market mix — not fee microdata.'
              : 'Enter figures and select Analyze. You can also load an example to explore the layout.'}
          </p>
        </div>

        {submitted && (
          <>
            {/* Metric tiles */}
            <div className="grid gap-3 sm:grid-cols-2">
              <Metric
                label="Origination charges"
                value={formatCurrency(inputs.originationCharges)}
                sub={`${analysis.derived.originationPct.toFixed(2)}% of loan · ${analysis.derived.originationBps.toFixed(0)} bps`}
              />
              <Metric
                label="Net lender cost"
                value={formatCurrency(analysis.derived.netLenderCost)}
                sub={`${analysis.derived.netLenderPct.toFixed(2)}% of loan (orig + points − credits)`}
              />
              <Metric
                label="Discount points"
                value={formatCurrency(inputs.discountPoints)}
                sub={`${analysis.derived.discountPointsPct.toFixed(2)}% of loan`}
              />
              <Metric
                label="Est. P&I (30-yr)"
                value={
                  analysis.derived.estimatedPrincipalAndInterest != null
                    ? formatCurrency(analysis.derived.estimatedPrincipalAndInterest)
                    : '—'
                }
                sub="Principal & interest only — not full PITI"
              />
            </div>

            {/* Bands */}
            <BandCard
              icon={<Scale className="h-4 w-4" aria-hidden="true" />}
              result={analysis.originationBand}
            />
            <BandCard
              icon={<BarChart3 className="h-4 w-4" aria-hidden="true" />}
              result={analysis.netCostBand}
            />

            {/* Visual bar for origination % */}
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <h3 className="mb-2 text-sm font-semibold text-[#0A2540]">
                Origination charges on a 0–3% scale
              </h3>
              <div className="relative h-3 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="absolute inset-y-0 left-0 bg-emerald-200"
                  style={{ width: `${(0.5 / 3) * 100}%` }}
                  title="Lower educational band"
                />
                <div
                  className="absolute inset-y-0 bg-sky-200"
                  style={{ left: `${(0.5 / 3) * 100}%`, width: `${(1 / 3) * 100}%` }}
                  title="Typical educational band"
                />
                <div
                  className="absolute inset-y-0 right-0 bg-amber-200"
                  style={{ left: `${(1.5 / 3) * 100}%` }}
                  title="Higher educational band"
                />
                <div
                  className="absolute top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-[#0A2540]"
                  style={{
                    left: `${Math.min(100, Math.max(0, (analysis.derived.originationPct / 3) * 100))}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                Marker = your origination % of loan. Colors are educational bands, not HMDA percentiles.
              </p>
            </div>

            {/* Rate / APR */}
            {analysis.rateAprNote && (
              <div className="flex gap-3 rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" aria-hidden="true" />
                <p>{analysis.rateAprNote}</p>
              </div>
            )}

            {/* Points education */}
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#0A2540]">
                <BookOpen className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                {analysis.pointsEducation.headline}
              </h3>
              <ul className="space-y-2 text-sm text-zinc-600">
                {analysis.pointsEducation.bullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* HMDA lender */}
            {analysis.hmdaLender ? (
              <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-4">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#0A2540]">
                  <Building2 className="h-4 w-4 text-teal-700" aria-hidden="true" />
                  Federal data on this lender (Florida, {analysis.hmdaLender.source})
                </h3>
                <p className="mb-3 text-xs text-zinc-600">
                  Activity context only — not a historical fee range for your Loan Estimate.
                </p>
                <dl className="grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-zinc-500">Florida originations</dt>
                    <dd className="font-semibold tabular-nums text-[#0A2540]">
                      {analysis.hmdaLender.floridaOriginations?.toLocaleString('en-US') ??
                        'Not available'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-zinc-500">Major counties with activity</dt>
                    <dd className="font-semibold tabular-nums text-[#0A2540]">
                      {analysis.hmdaLender.countiesWithActivity ?? 'Not available'}
                    </dd>
                  </div>
                  {analysis.hmdaLender.conventionalPct != null && (
                    <div className="sm:col-span-2">
                      <dt className="text-xs text-zinc-500">Loan-type mix (originations)</dt>
                      <dd className="text-zinc-700">
                        Conv {analysis.hmdaLender.conventionalPct}%
                        {analysis.hmdaLender.fhaPct != null
                          ? ` · FHA ${analysis.hmdaLender.fhaPct}%`
                          : ''}
                        {analysis.hmdaLender.vaPct != null
                          ? ` · VA ${analysis.hmdaLender.vaPct}%`
                          : ''}
                      </dd>
                    </div>
                  )}
                </dl>
                {analysis.hmdaLender.topCounties.length > 0 && (
                  <p className="mt-3 text-xs text-zinc-600">
                    Top counties:{' '}
                    {analysis.hmdaLender.topCounties
                      .slice(0, 4)
                      .map((c) => `${c.name} (${c.originations.toLocaleString()})`)
                      .join('; ')}
                  </p>
                )}
                <Link
                  href={analysis.hmdaLender.profileHref}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#059669] hover:underline"
                >
                  Open lender profile & HMDA evidence panel
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
                <p className="font-medium text-zinc-800">No lender HMDA context selected</p>
                <p className="mt-1">
                  Choose a HMDA-matched lender above to attach 2025 Florida federal activity. Many
                  national originators are already linked in our directory.
                </p>
              </div>
            )}

            {/* HMDA county */}
            {analysis.hmdaCounty ? (
              <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-4">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#0A2540]">
                  <MapPin className="h-4 w-4 text-sky-700" aria-hidden="true" />
                  {analysis.hmdaCounty.countyName} County market ({analysis.hmdaCounty.source})
                </h3>
                <p className="mb-3 text-xs text-zinc-600">
                  County aggregates for applications and originations — not median origination fees.
                </p>
                <dl className="grid gap-2 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-xs text-zinc-500">Applications</dt>
                    <dd className="font-semibold tabular-nums">
                      {analysis.hmdaCounty.applications.toLocaleString('en-US')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-zinc-500">Originations</dt>
                    <dd className="font-semibold tabular-nums">
                      {analysis.hmdaCounty.originations.toLocaleString('en-US')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-zinc-500">Denial rate</dt>
                    <dd className="font-semibold tabular-nums">
                      {analysis.hmdaCounty.denialRatePct.toFixed(1)}%
                    </dd>
                  </div>
                </dl>
                <p className="mt-2 text-xs text-zinc-600">
                  Origination mix: Conv {analysis.hmdaCounty.conventionalPct}% · FHA{' '}
                  {analysis.hmdaCounty.fhaPct}% · VA {analysis.hmdaCounty.vaPct}% · Purchase/refi
                  split {analysis.hmdaCounty.purchasePct.toFixed(0)}% /{' '}
                  {analysis.hmdaCounty.refinancePct.toFixed(0)}%
                </p>
                <Link
                  href={analysis.hmdaCounty.countyHref}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#059669] hover:underline"
                >
                  County market intelligence page
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            ) : null}

            {/* Limitations */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-950">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                Limitations & disclaimers
              </h3>
              <ul className="space-y-1.5 text-xs leading-relaxed text-amber-950/90">
                {analysis.limitations.map((l) => (
                  <li key={l}>• {l}</li>
                ))}
                <li>
                  • Always re-read your official Loan Estimate and Closing Disclosure. Re-verify
                  company identity on{' '}
                  <a
                    href="https://www.nmlsconsumeraccess.org/"
                    className="underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    NMLS Consumer Access
                  </a>
                  .
                </li>
              </ul>
            </div>

            {/* Citations */}
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <h3 className="mb-2 text-sm font-semibold text-[#0A2540]">Sources</h3>
              <ul className="space-y-2 text-xs text-zinc-600">
                {analysis.citations.map((c) => (
                  <li key={c.label}>
                    <span className="font-semibold text-zinc-800">{c.label}:</span> {c.detail}
                  </li>
                ))}
                <li>
                  <span className="font-semibold text-zinc-800">HMDA Data Browser:</span>{' '}
                  <a
                    href="https://ffiec.cfpb.gov/data-browser/"
                    className="text-[#059669] underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ffiec.cfpb.gov/data-browser
                  </a>
                </li>
              </ul>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-[#0A2540] outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500';

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-zinc-700">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1 text-xl font-bold tabular-nums text-[#0A2540]">{value}</div>
      <div className="mt-1 text-xs text-zinc-500">{sub}</div>
    </div>
  );
}

function BandCard({
  icon,
  result,
}: {
  icon: ReactNode;
  result: { level: FeeBandLevel; label: string; framing: string; detail: string; sourceNote: string };
}) {
  return (
    <div className={cn('rounded-xl border p-4', bandStyles(result.level))}>
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="text-zinc-700">{icon}</span>
        <h3 className="text-sm font-semibold">{result.label}</h3>
        <Badge variant="outline" className="border-current/20 bg-white/60 text-[10px]">
          {result.framing}
        </Badge>
      </div>
      <p className="text-sm leading-relaxed opacity-95">{result.detail}</p>
      <p className="mt-2 text-[11px] opacity-80">{result.sourceNote}</p>
    </div>
  );
}
