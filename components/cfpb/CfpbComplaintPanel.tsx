import type { ReactNode } from 'react';
import { AlertTriangle, Clock, MessageSquareWarning, Scale } from 'lucide-react';
import type { CfpbComplaintEvidence } from '@/lib/cfpb';
import { CfpbSourceNote } from './CfpbSourceNote';

function formatInt(n: number): string {
  return n.toLocaleString('en-US');
}

export function CfpbComplaintPanel({ evidence }: { evidence: CfpbComplaintEvidence }) {
  const norm = evidence.normalization;

  return (
    <section
      aria-labelledby="cfpb-complaint-evidence-heading"
      className="mt-8 overflow-hidden rounded-2xl border border-amber-900/15 bg-gradient-to-br from-amber-50/80 via-white to-slate-50 shadow-sm"
    >
      <div className="border-b border-amber-900/10 bg-[#0A2540] px-5 py-4 text-white md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-200/90">
              Consumer complaint context
            </p>
            <h2 id="cfpb-complaint-evidence-heading" className="mt-1 text-xl font-bold md:text-2xl">
              What the CFPB complaint database shows
            </h2>
            <p className="mt-1 text-sm text-slate-200">
              Source: {evidence.source} · Mortgage product only · Not a score or ranking
            </p>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-amber-100 ring-1 ring-white/20">
            Research panel
          </span>
        </div>
      </div>

      <div className="space-y-6 p-5 md:p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={<MessageSquareWarning className="h-4 w-4" aria-hidden="true" />}
            label="Mortgage complaints (all published)"
            value={formatInt(evidence.totalComplaints)}
            hint="Cumulative published rows for matched company name(s)"
          />
          <StatCard
            icon={<Clock className="h-4 w-4" aria-hidden="true" />}
            label={`Recent complaints (≥ ${evidence.recentWindowStart})`}
            value={formatInt(evidence.complaintsLast24Months)}
            hint="~24-month window from snapshot date"
          />
          <StatCard
            icon={<Scale className="h-4 w-4" aria-hidden="true" />}
            label="Timely company response"
            value={
              evidence.timelyYesPct != null
                ? `${evidence.timelyYesPct.toFixed(1)}%`
                : 'Not available'
            }
            hint={
              evidence.timelyYes + evidence.timelyNo > 0
                ? `${formatInt(evidence.timelyYes)} yes · ${formatInt(evidence.timelyNo)} no`
                : undefined
            }
          />
        </div>

        {evidence.topIssues.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-[#0A2540]">Top complaint issues</h3>
            <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
              {evidence.topIssues.map((issue) => (
                <li
                  key={issue.key}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                >
                  <span className="text-zinc-800">{issue.key}</span>
                  <span className="shrink-0 tabular-nums font-medium text-[#0A2540]">
                    {formatInt(issue.count)}
                    <span className="ml-1 font-normal text-zinc-500">({issue.pct}%)</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {evidence.companyResponses.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-[#0A2540]">
              Company response (as published)
            </h3>
            <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
              {evidence.companyResponses.map((row) => (
                <li
                  key={row.key}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                >
                  <span className="text-zinc-800">{row.key}</span>
                  <span className="shrink-0 tabular-nums text-zinc-700">
                    {formatInt(row.count)}
                    <span className="ml-1 text-zinc-500">({row.pct}%)</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {norm.readyForDisplay &&
          norm.hmdaFloridaOriginations != null &&
          norm.complaintsPerThousandOriginations != null && (
            <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-4">
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-[#0A2540]">
                <AlertTriangle className="h-4 w-4 text-amber-700" aria-hidden="true" />
                Size context vs Florida HMDA originations (experimental)
              </div>
              <p className="text-2xl font-bold tabular-nums text-[#0A2540]">
                {norm.complaintsPerThousandOriginations.toLocaleString('en-US', {
                  maximumFractionDigits: 1,
                })}
                <span className="ml-2 text-sm font-medium text-zinc-600">
                  complaints / 1,000 FL originations
                </span>
              </p>
              <p className="mt-2 text-xs leading-relaxed text-zinc-600">
                Uses {norm.complaintsWindow === '24m' ? 'recent (~24 month)' : 'all-time'} national
                mortgage complaints ({formatInt(norm.complaintsInWindow ?? 0)}) and Florida HMDA
                originations ({formatInt(norm.hmdaFloridaOriginations)}
                {norm.hmdaYear ? `, ${norm.hmdaYear}` : ''}). These windows are not the same
                market or period — this is rough size context only, not a ranking or fault finding.
              </p>
            </div>
          )}

        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-xs leading-relaxed text-zinc-600">
          <p className="font-semibold text-[#0A2540]">Matching & scope</p>
          <p className="mt-1">{evidence.matchNote}</p>
          <p className="mt-2">
            CFPB company name(s):{' '}
            <span className="font-medium text-zinc-800">
              {evidence.companiesMatched.join('; ')}
            </span>
          </p>
          <p className="mt-2">{norm.note}</p>
        </div>

        <CfpbSourceNote dataAsOf={evidence.dataAsOf} />
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
        <span className="text-amber-800">{icon}</span>
        {label}
      </div>
      <div className="text-xl font-bold tabular-nums text-[#0A2540]">{value}</div>
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}
