import type { ReactNode } from 'react';
import Link from 'next/link';
import { BarChart3, MapPin, PieChart } from 'lucide-react';
import type { HmdaLenderEvidence } from '@/lib/hmda';
import { HmdaSourceNote } from './HmdaSourceNote';

function formatInt(n: number | null | undefined): string {
  if (n == null) return 'Not available in public HMDA data';
  return n.toLocaleString('en-US');
}

function MixBar({
  label,
  pct,
  count,
}: {
  label: string;
  pct: number;
  count: number;
}) {
  if (count <= 0 && pct <= 0) return null;
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="text-zinc-700">{label}</span>
        <span className="tabular-nums text-zinc-600">
          {pct.toFixed(1)}% · {count.toLocaleString('en-US')}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-[#0A2540]/85"
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
    </div>
  );
}

export function HmdaLenderEvidencePanel({ evidence }: { evidence: HmdaLenderEvidence }) {
  const mix = evidence.loanTypeMix;

  return (
    <section
      aria-labelledby="hmda-lender-evidence-heading"
      className="mt-8 overflow-hidden rounded-2xl border border-[#0A2540]/15 bg-gradient-to-br from-slate-50 via-white to-teal-50/40 shadow-sm"
    >
      <div className="border-b border-[#0A2540]/10 bg-[#0A2540] px-5 py-4 text-white md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-200/90">
              Federal mortgage data
            </p>
            <h2 id="hmda-lender-evidence-heading" className="mt-1 text-xl font-bold md:text-2xl">
              What the federal data shows
            </h2>
            <p className="mt-1 text-sm text-slate-200">
              Source: {evidence.source} · Florida activity only · Not a score or ranking
            </p>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-teal-100 ring-1 ring-white/20">
            Research panel
          </span>
        </div>
      </div>

      <div className="space-y-6 p-5 md:p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={<BarChart3 className="h-4 w-4" aria-hidden="true" />}
            label="Florida originations"
            value={formatInt(evidence.floridaOriginations)}
          />
          <StatCard
            icon={<MapPin className="h-4 w-4" aria-hidden="true" />}
            label="Major FL counties with activity"
            value={formatInt(evidence.countiesWithActivity)}
            hint="Among tracked high-volume counties"
          />
          <StatCard
            icon={<PieChart className="h-4 w-4" aria-hidden="true" />}
            label="Florida applications (selected outcomes)"
            value={formatInt(evidence.floridaApplications)}
            hint="Originated + denied + approved not accepted"
          />
        </div>

        {evidence.topCounties.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-[#0A2540]">Top counties by originations</h3>
            <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
              {evidence.topCounties.map((c) => (
                <li
                  key={`${c.name}-${c.originations}`}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                >
                  <span className="text-zinc-800">{c.name} County</span>
                  <span className="tabular-nums font-medium text-[#0A2540]">
                    {c.originations > 0
                      ? c.originations.toLocaleString('en-US')
                      : 'Not available in public HMDA data'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {mix && (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-[#0A2540]">
              Loan-type mix (Florida originations)
            </h3>
            <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
              <MixBar label="Conventional" pct={mix.conventionalPct} count={mix.conventionalOrig} />
              <MixBar label="FHA" pct={mix.fhaPct} count={mix.fhaOrig} />
              <MixBar label="VA" pct={mix.vaPct} count={mix.vaOrig} />
              <MixBar label="USDA / RHS" pct={mix.usdaPct} count={mix.usdaOrig} />
            </div>
          </div>
        )}

        {evidence.countyShares.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-[#0A2540]">
              Market share in key counties
            </h3>
            <p className="mb-2 text-xs text-zinc-500">
              Share of county originations among all HMDA filers in that county (shown when ≥ 1%).
            </p>
            <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
              {evidence.countyShares.map((c) => (
                <li
                  key={c.countySlug}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm"
                >
                  <Link
                    href={`/local-lenders/florida/${c.countySlug}`}
                    className="font-medium text-[#3B82F6] hover:underline"
                  >
                    {c.countyName} County
                  </Link>
                  <span className="tabular-nums text-zinc-700">
                    {c.originations.toLocaleString('en-US')} originations
                    {c.marketSharePct != null ? ` · ${c.marketSharePct.toFixed(1)}% share` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-xl border border-teal-200/80 bg-white/80 p-4">
          <p className="text-sm font-semibold text-[#0A2540]">Have a Loan Estimate from this lender?</p>
          <p className="mt-1 text-xs text-zinc-600">
            Use our free Loan Estimate Analyzer for educational fee bands plus this lender&apos;s 2025
            Florida HMDA context — no phone number required.
          </p>
          <Link
            href={`/tools/loan-estimate-analyzer?lender=${encodeURIComponent(evidence.slug)}`}
            className="mt-2 inline-flex text-sm font-semibold text-[#059669] hover:underline"
          >
            Open Loan Estimate Analyzer →
          </Link>
        </div>

        <HmdaSourceNote />
      </div>
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
        <span className="text-teal-700">{icon}</span>
        {label}
      </div>
      <div className="text-xl font-bold tabular-nums text-[#0A2540]">{value}</div>
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}
