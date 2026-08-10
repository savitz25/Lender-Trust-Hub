import Link from 'next/link';
import { Building2, Scale } from 'lucide-react';
import type { HmdaStateMarketSummary } from '@/lib/hmda';
import { HmdaSourceNote } from './HmdaSourceNote';

/**
 * Light state-hub authority block from existing HMDA county extracts.
 * No fake freshness stamps — uses vintage on the data itself.
 */
export function HmdaStateSummaryPanel({ summary }: { summary: HmdaStateMarketSummary }) {
  return (
    <section
      aria-labelledby="hmda-state-summary-heading"
      className="overflow-hidden rounded-2xl border border-[#0A2540]/15 bg-gradient-to-br from-slate-50 via-white to-sky-50/40 shadow-sm"
    >
      <div className="border-b border-[#0A2540]/10 bg-[#0A2540] px-5 py-4 text-white md:px-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-sky-200/90">
          Federal mortgage data · HMDA
        </p>
        <h2 id="hmda-state-summary-heading" className="mt-1 text-xl font-bold md:text-2xl">
          What the HMDA data shows in {summary.stateName}
        </h2>
        <p className="mt-1 text-sm text-slate-200">
          Aggregated from {summary.countyCount} major-county extracts · {summary.source} · Not a
          ranking or score
        </p>
      </div>

      <div className="space-y-5 p-5 md:p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Applications (major counties)" value={summary.applications.toLocaleString('en-US')} />
          <Metric label="Originations" value={summary.originations.toLocaleString('en-US')} />
          <Metric
            label="Denial rate"
            value={
              summary.denialRatePct != null ? `${summary.denialRatePct.toFixed(1)}%` : '—'
            }
            hint="Denials ÷ applications across included counties"
          />
          <Metric
            label="Purchase vs refinance"
            value={
              summary.purchasePct != null && summary.refinancePct != null
                ? `${summary.purchasePct.toFixed(0)}% / ${summary.refinancePct.toFixed(0)}%`
                : '—'
            }
          />
        </div>

        {summary.topCounties.length > 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#0A2540]">
              <Scale className="h-4 w-4 text-teal-700" aria-hidden />
              Higher-volume counties in this extract
            </h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {summary.topCounties.map((c) => (
                <li key={c.countySlug}>
                  <Link
                    href={`/local-lenders/${summary.stateSlug}/${c.countySlug}`}
                    className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2 text-sm hover:border-emerald-300 hover:bg-emerald-50/40"
                  >
                    <span className="font-medium text-[#0A2540]">{c.countyName} County</span>
                    <span className="tabular-nums text-xs text-zinc-500">
                      {c.originations.toLocaleString('en-US')} orig.
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link
            href={`/tools/program-finder?state=${encodeURIComponent(summary.stateSlug)}`}
            className="font-semibold text-[#059669] hover:underline"
          >
            Explore assistance programs
          </Link>
          <span className="text-zinc-300" aria-hidden>
            ·
          </span>
          <Link
            href="/tools/loan-estimate-analyzer"
            className="font-semibold text-[#059669] hover:underline"
          >
            Understand your Loan Estimate
          </Link>
          <span className="text-zinc-300" aria-hidden>
            ·
          </span>
          <Link
            href="/tools/compare-loan-estimates"
            className="font-semibold text-[#059669] hover:underline"
          >
            Compare offers side by side
          </Link>
        </div>

        <HmdaSourceNote />
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
        <Building2 className="h-3.5 w-3.5 text-teal-700" aria-hidden />
        {label}
      </p>
      <p className="mt-1 text-xl font-bold tabular-nums text-[#0A2540]">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-zinc-400">{hint}</p> : null}
    </div>
  );
}
