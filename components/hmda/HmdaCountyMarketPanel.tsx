import Link from 'next/link';
import { Building2, Percent, Scale } from 'lucide-react';
import type { HmdaCountyEvidence } from '@/lib/hmda';
import { HmdaSourceNote } from './HmdaSourceNote';

export function HmdaCountyMarketPanel({ evidence }: { evidence: HmdaCountyEvidence }) {
  const mix = evidence.loanTypeMix;

  return (
    <section
      aria-labelledby="hmda-county-evidence-heading"
      className="mb-10 overflow-hidden rounded-2xl border border-[#0A2540]/15 bg-gradient-to-br from-slate-50 via-white to-sky-50/50 shadow-sm"
    >
      <div className="border-b border-[#0A2540]/10 bg-[#0A2540] px-5 py-4 text-white md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-200/90">
              Federal mortgage data · HMDA
            </p>
            <h2 id="hmda-county-evidence-heading" className="mt-1 text-xl font-bold md:text-2xl">
              What the federal data shows — {evidence.countyName} County
            </h2>
            <p className="mt-1 text-sm text-slate-200">
              Source: {evidence.source} ·{' '}
              {evidence.stateSlug === 'texas'
                ? 'Texas'
                : evidence.stateSlug === 'georgia'
                  ? 'Georgia'
                  : evidence.stateSlug === 'florida'
                    ? 'Florida'
                    : evidence.state}{' '}
              ({evidence.state}) county-level activity · Not a score or ranking
            </p>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-sky-100 ring-1 ring-white/20">
            Research panel
          </span>
        </div>
      </div>

      <div className="space-y-6 p-5 md:p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Applications" value={evidence.applications.toLocaleString('en-US')} />
          <Metric label="Originations" value={evidence.originations.toLocaleString('en-US')} />
          <Metric
            label="Denial rate"
            value={`${evidence.denialRatePct.toFixed(1)}%`}
            hint="Denials ÷ applications (cleaned HMDA county extract)"
          />
          <Metric
            label="Purchase vs refinance"
            value={`${evidence.purchasePct.toFixed(0)}% / ${evidence.refinancePct.toFixed(0)}%`}
            hint="Share of purchase vs refi among those purposes"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#0A2540]">
              <Scale className="h-4 w-4 text-teal-700" aria-hidden="true" />
              Loan-type mix (originations)
            </h3>
            <ul className="space-y-2 text-sm">
              <MixRow label="Conventional" pct={mix.conventionalPct} n={mix.conventionalOrig} />
              <MixRow label="FHA" pct={mix.fhaPct} n={mix.fhaOrig} />
              <MixRow label="VA" pct={mix.vaPct} n={mix.vaOrig} />
              <MixRow label="USDA / RHS" pct={mix.usdaPct} n={mix.usdaOrig} />
            </ul>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#0A2540]">
              <Percent className="h-4 w-4 text-teal-700" aria-hidden="true" />
              Purchase vs refinance
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Home purchase</span>
                <span className="tabular-nums font-medium">
                  {evidence.purchaseOrig.toLocaleString('en-US')} · {evidence.purchasePct.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Refinance (incl. cash-out)</span>
                <span className="tabular-nums font-medium">
                  {evidence.refinanceOrig.toLocaleString('en-US')} ·{' '}
                  {evidence.refinancePct.toFixed(1)}%
                </span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full bg-[#0A2540]"
                  style={{ width: `${Math.min(100, evidence.purchasePct)}%` }}
                  title="Purchase share"
                />
              </div>
              <p className="text-xs text-zinc-500">Bar shows purchase share of purchase + refinance.</p>
            </div>
          </div>
        </div>

        {evidence.topMatchedLenders.length > 0 && (
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#0A2540]">
              <Building2 className="h-4 w-4 text-teal-700" aria-hidden="true" />
              Most active matched lenders in this county
            </h3>
            <p className="mb-3 text-xs text-zinc-500">
              Ranked by actual HMDA originations in {evidence.countyName} County ({evidence.year}).
              Only institutions matched to our directory evidence set are linked.
            </p>
            <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
              <table className="w-full min-w-[480px] text-sm">
                <thead className="border-b bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">Lender</th>
                    <th className="px-4 py-3 text-right">Originations</th>
                    <th className="px-4 py-3 text-right">County share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {evidence.topMatchedLenders.map((l) => (
                    <tr key={l.lei}>
                      <td className="px-4 py-3">
                        {l.slug ? (
                          <Link
                            href={`/lenders/${l.slug}`}
                            className="font-medium text-[#3B82F6] hover:underline"
                          >
                            {l.name}
                          </Link>
                        ) : (
                          <span className="text-zinc-800">{l.name}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-[#0A2540]">
                        {l.originations.toLocaleString('en-US')}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-zinc-600">
                        {l.marketSharePct != null
                          ? `${l.marketSharePct.toFixed(1)}%`
                          : 'Not available in public HMDA data'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Loan Estimate tool CTAs: county page shell (LoanEstimateToolsCta) — keep panel focused on data. */}

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
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1 text-xl font-bold tabular-nums text-[#0A2540]">{value}</div>
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

function MixRow({ label, pct, n }: { label: string; pct: number; n: number }) {
  return (
    <li className="flex items-center justify-between gap-2">
      <span className="text-zinc-700">{label}</span>
      <span className="tabular-nums text-zinc-600">
        {pct.toFixed(1)}% · {n.toLocaleString('en-US')}
      </span>
    </li>
  );
}
