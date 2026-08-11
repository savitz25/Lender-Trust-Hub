'use client';

import { useMemo, useState } from 'react';
import { ArrowUpRight, Info } from 'lucide-react';
import { analyzeLoanEstimateClient } from '@/lib/tools/loan-estimate-analyzer/client-analyze';
import { emptyLoanEstimateInputs } from '@/lib/tools/loan-estimate-analyzer/defaults';
import type {
  FeeBandLevel,
  LoanEstimateLoanType,
} from '@/lib/tools/loan-estimate-analyzer/types';
import type { AnalyzerBootstrap } from '@/lib/tools/loan-estimate-analyzer/serialize-context';
import { FredRateContextPanel } from '@/components/rates/FredRateContextPanel';
import { EmbedAnalytics } from '@/components/embed/embed-analytics';
import { trackLenderEvent } from '@/lib/analytics/ga-events';
import { formatCurrency, cn } from '@/lib/utils';

const LOAN_TYPES: { value: LoanEstimateLoanType; label: string }[] = [
  { value: 'conventional', label: 'Conventional' },
  { value: 'fha', label: 'FHA' },
  { value: 'va', label: 'VA' },
  { value: 'usda', label: 'USDA' },
  { value: 'jumbo', label: 'Jumbo' },
  { value: 'other', label: 'Other' },
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

function buildFullToolHref(opts: {
  lenderSlug?: string;
  countySlug?: string;
  embedSrc?: string;
  loanAmount?: string;
  rate?: string;
  apr?: string;
  origination?: string;
  points?: string;
  credits?: string;
}): string {
  const p = new URLSearchParams();
  if (opts.lenderSlug) p.set('lender', opts.lenderSlug);
  if (opts.countySlug) p.set('county', opts.countySlug);
  if (opts.embedSrc) p.set('src', 'embed');
  if (opts.embedSrc) p.set('partner', opts.embedSrc);
  if (opts.loanAmount) p.set('loanAmount', opts.loanAmount);
  if (opts.rate) p.set('rate', opts.rate);
  if (opts.apr) p.set('apr', opts.apr);
  if (opts.origination) p.set('origination', opts.origination);
  if (opts.points) p.set('points', opts.points);
  if (opts.credits) p.set('credits', opts.credits);
  const qs = p.toString();
  return `https://www.lendertrusthub.com/tools/loan-estimate-analyzer${qs ? `?${qs}` : ''}`;
}

type Props = {
  bootstrap: AnalyzerBootstrap;
  initialLenderSlug?: string;
  initialCountySlug?: string;
  /** Soft note when URL lender/county was invalid */
  contextNote?: string | null;
  embedSrc?: string;
};

/**
 * Stage C.2 — compact Loan Estimate Analyzer for iframe embeds.
 * Reuses analyzeLoanEstimateClient — no forked fee math.
 */
export function LoanEstimateAnalyzerEmbed({
  bootstrap,
  initialLenderSlug = '',
  initialCountySlug = '',
  contextNote,
  embedSrc,
}: Props) {
  const [loanAmount, setLoanAmount] = useState('350000');
  const [interestRate, setInterestRate] = useState('6.5');
  const [apr, setApr] = useState('6.75');
  const [originationCharges, setOriginationCharges] = useState('3500');
  const [discountPoints, setDiscountPoints] = useState('0');
  const [lenderCredits, setLenderCredits] = useState('0');
  const [totalClosingCosts, setTotalClosingCosts] = useState('');
  const [loanType, setLoanType] = useState<LoanEstimateLoanType>('conventional');
  const [lenderSlug] = useState(initialLenderSlug);
  const [countySlug] = useState(initialCountySlug);
  const [submitted, setSubmitted] = useState(false);

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

  const hmdaLender = lenderSlug
    ? bootstrap.lenderContextBySlug[lenderSlug] ?? null
    : null;
  const hmdaCounty = countySlug
    ? bootstrap.countyContextBySlug[countySlug] ?? null
    : null;

  const analysis = useMemo(
    () => analyzeLoanEstimateClient(inputs, hmdaLender, hmdaCounty),
    [inputs, hmdaLender, hmdaCounty]
  );

  const fullHref = buildFullToolHref({
    lenderSlug: lenderSlug || undefined,
    countySlug: countySlug || undefined,
    embedSrc,
    loanAmount,
    rate: interestRate,
    apr: apr || undefined,
    origination: originationCharges,
    points: discountPoints,
    credits: lenderCredits,
  });

  const compareHref = (() => {
    const p = new URLSearchParams();
    if (lenderSlug) p.set('lender', lenderSlug);
    if (countySlug) p.set('county', countySlug);
    p.set('loanAmount', loanAmount);
    p.set('rate', interestRate);
    if (apr.trim()) p.set('apr', apr);
    p.set('origination', originationCharges);
    p.set('points', discountPoints);
    p.set('credits', lenderCredits);
    return `https://www.lendertrusthub.com/tools/compare-loan-estimates?${p.toString()}`;
  })();

  function onAnalyze() {
    setSubmitted(true);
    trackLenderEvent('embed_analyze', {
      embed_kind: 'loan-estimate-analyzer',
      embed_src: embedSrc ?? '',
      has_lender: Boolean(hmdaLender),
      has_county: Boolean(hmdaCounty),
    });
  }

  const fieldCls =
    'mt-1 w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-sm tabular-nums text-[#0A2540] focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500';

  return (
    <article
      className="mx-auto max-w-lg overflow-hidden rounded-2xl border border-[#0A2540]/12 bg-white shadow-sm"
      data-embed="loan-estimate-analyzer"
    >
      <EmbedAnalytics
        kind="loan-estimate-analyzer"
        state={hmdaCounty?.stateSlug ?? hmdaLender?.primaryStateCode}
        county={hmdaCounty?.countySlug}
        embedSrc={embedSrc}
        hasData
        extra={{
          has_lender: Boolean(hmdaLender),
          has_county: Boolean(hmdaCounty),
        }}
      />

      <header className="border-b border-[#0A2540]/10 bg-[#0A2540] px-4 py-3.5 text-white">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-200/90">
          Loan Estimate research · Educational
        </p>
        <h1 className="mt-1 text-base font-bold leading-snug sm:text-lg">
          Understand your Loan Estimate
        </h1>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-200">
          Fee bands &amp; market context · Not underwriting · No lead form
        </p>
      </header>

      <div className="space-y-3 p-4">
        {contextNote ? (
          <p className="rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-[11px] leading-relaxed text-amber-950">
            {contextNote}
          </p>
        ) : null}

        {(hmdaLender || hmdaCounty) && (
          <div className="rounded-lg border border-zinc-100 bg-zinc-50/90 px-3 py-2 text-[11px] leading-relaxed text-zinc-700">
            {hmdaLender ? (
              <p>
                <span className="font-semibold text-[#0A2540]">{hmdaLender.name}</span>
                {hmdaLender.stateOriginations != null
                  ? ` · ${hmdaLender.stateOriginations.toLocaleString('en-US')} originations (${hmdaLender.primaryStateName}, HMDA)`
                  : null}
              </p>
            ) : null}
            {hmdaCounty ? (
              <p className={hmdaLender ? 'mt-1' : undefined}>
                <span className="font-semibold text-[#0A2540]">
                  {hmdaCounty.countyName} County, {hmdaCounty.stateName}
                </span>
                {` · ${hmdaCounty.originations.toLocaleString('en-US')} originations · ${hmdaCounty.denialRatePct.toFixed(1)}% denial rate`}
              </p>
            ) : null}
            <p className="mt-1 text-zinc-500">
              Volume/mix only — not fee percentiles. We show the public record. You decide.
            </p>
          </div>
        )}

        <FredRateContextPanel
          benchmarks={bootstrap.mortgageBenchmarks}
          userRate={parseRate(interestRate)}
          compact
          className="!p-3 text-xs"
        />

        <div className="grid grid-cols-2 gap-2">
          <label className="text-[11px] font-semibold text-zinc-600">
            Loan amount ($)
            <input
              className={fieldCls}
              inputMode="decimal"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
            />
          </label>
          <label className="text-[11px] font-semibold text-zinc-600">
            Interest rate (%)
            <input
              className={fieldCls}
              inputMode="decimal"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
            />
          </label>
          <label className="text-[11px] font-semibold text-zinc-600">
            APR (%)
            <input
              className={fieldCls}
              inputMode="decimal"
              value={apr}
              onChange={(e) => setApr(e.target.value)}
              placeholder="optional"
            />
          </label>
          <label className="text-[11px] font-semibold text-zinc-600">
            Loan type
            <select
              className={fieldCls}
              value={loanType}
              onChange={(e) => setLoanType(e.target.value as LoanEstimateLoanType)}
            >
              {LOAN_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[11px] font-semibold text-zinc-600">
            Origination ($)
            <input
              className={fieldCls}
              inputMode="decimal"
              value={originationCharges}
              onChange={(e) => setOriginationCharges(e.target.value)}
            />
          </label>
          <label className="text-[11px] font-semibold text-zinc-600">
            Discount points ($)
            <input
              className={fieldCls}
              inputMode="decimal"
              value={discountPoints}
              onChange={(e) => setDiscountPoints(e.target.value)}
            />
          </label>
          <label className="text-[11px] font-semibold text-zinc-600">
            Lender credits ($)
            <input
              className={fieldCls}
              inputMode="decimal"
              value={lenderCredits}
              onChange={(e) => setLenderCredits(e.target.value)}
            />
          </label>
          <label className="text-[11px] font-semibold text-zinc-600">
            Total closing ($)
            <input
              className={fieldCls}
              inputMode="decimal"
              value={totalClosingCosts}
              onChange={(e) => setTotalClosingCosts(e.target.value)}
              placeholder="optional"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={onAnalyze}
          className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          Analyze fees
        </button>

        {submitted ? (
          <div className="space-y-2.5 border-t border-zinc-100 pt-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-2">
                <p className="text-[10px] font-semibold uppercase text-zinc-500">Net lender cost</p>
                <p className="text-base font-bold tabular-nums text-[#0A2540]">
                  {formatCurrency(analysis.derived.netLenderCost)}
                </p>
                <p className="text-[10px] text-zinc-500">
                  {analysis.derived.netLenderPct.toFixed(2)}% of loan
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-2">
                <p className="text-[10px] font-semibold uppercase text-zinc-500">Est. monthly P&amp;I</p>
                <p className="text-base font-bold tabular-nums text-[#0A2540]">
                  {analysis.derived.estimatedPrincipalAndInterest != null
                    ? formatCurrency(analysis.derived.estimatedPrincipalAndInterest)
                    : '—'}
                </p>
                <p className="text-[10px] text-zinc-500">30-year fixed assumption</p>
              </div>
            </div>

            <div
              className={cn(
                'rounded-lg border px-2.5 py-2 text-xs',
                bandStyles(analysis.originationBand.level)
              )}
            >
              <p className="font-semibold">
                Origination: {analysis.originationBand.label} · {analysis.originationBand.framing}
              </p>
              <p className="mt-0.5 opacity-90">{analysis.originationBand.detail}</p>
            </div>
            <div
              className={cn(
                'rounded-lg border px-2.5 py-2 text-xs',
                bandStyles(analysis.netCostBand.level)
              )}
            >
              <p className="font-semibold">
                Net lender cost: {analysis.netCostBand.label} · {analysis.netCostBand.framing}
              </p>
              <p className="mt-0.5 opacity-90">{analysis.netCostBand.detail}</p>
            </div>

            {analysis.rateAprNote ? (
              <p className="flex gap-1.5 text-[11px] leading-relaxed text-zinc-600">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden />
                {analysis.rateAprNote}
              </p>
            ) : null}

            <p className="text-[10px] leading-relaxed text-zinc-500">
              Educational bands use published thresholds — not HMDA fee microdata or underwriting.
            </p>
          </div>
        ) : (
          <p className="text-center text-[11px] text-zinc-500">
            Enter figures from your Loan Estimate, then analyze — results appear here (no account).
          </p>
        )}

        <a
          href={fullHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A2540] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0d3356]"
          data-embed-cta="full-analyzer"
          data-embed-src={embedSrc ?? ''}
        >
          Open full Loan Estimate Analyzer
          <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
        </a>
        <a
          href={compareHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-1 text-xs font-semibold text-emerald-800 hover:underline"
          data-embed-cta="compare-tool"
        >
          Compare estimates side by side
          <ArrowUpRight className="h-3 w-3" aria-hidden />
        </a>
        <p className="text-center text-[10px] text-zinc-400">
          Lender Trust Hub · research only · no lead form
        </p>
      </div>
    </article>
  );
}
