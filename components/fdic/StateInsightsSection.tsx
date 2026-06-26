import Link from 'next/link';
import { Home, Building2, Shield, TrendingUp, Users } from 'lucide-react';
import type { StateMeta } from '@/lib/fdic/types';
import { generateStateInsights } from '@/lib/fdic/insights';
import type { FDICBank } from '@/lib/fdic/types';
import { EditorialByline } from '@/components/directory/EditorialByline';

const ICONS = {
  home: Home,
  building: Building2,
  shield: Shield,
  trending: TrendingUp,
} as const;

export function StateInsightsSection({
  banks,
  stateMeta,
}: {
  banks: FDICBank[];
  stateMeta: StateMeta;
}) {
  const { bestFor, scenarios, regulatorBreakdown } = generateStateInsights(banks, stateMeta);

  return (
    <section aria-labelledby="insights-heading" className="mt-10 space-y-8">
      <div>
        <h2 id="insights-heading" className="text-2xl font-bold text-[#0A2540]">
          {stateMeta.fullName} Banking Insights
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-zinc-600">
          Data-driven recommendations based on official FDIC records — not paid placements or
          sponsored rankings.
        </p>
        <EditorialByline topic="FDIC banking insights" />
      </div>

      {/* Best For cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {bestFor.map((card) => {
          const Icon = ICONS[card.icon];
          return (
            <article
              key={card.title}
              className="rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-[#00A3A1]/40"
            >
              <Icon className="mb-3 h-6 w-6 text-[#00A3A1]" aria-hidden="true" />
              <h3 className="font-semibold text-[#0A2540]">{card.title}</h3>
              <p className="mt-2 text-sm text-zinc-600">{card.description}</p>
              {card.bankNames.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm text-zinc-700">
                  {card.bankNames.map((name) => (
                    <li key={name} className="flex gap-2">
                      <span className="text-[#00A3A1]">•</span>
                      {name}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-xs font-medium text-[#00A3A1]">{card.filterHint}</p>
            </article>
          );
        })}
      </div>

      {/* Regulator comparison table — unique per-state data */}
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[400px] text-sm">
          <caption className="sr-only">
            Primary regulator breakdown for FDIC banks in {stateMeta.fullName}
          </caption>
          <thead className="border-b bg-zinc-50 text-xs font-semibold uppercase text-zinc-500">
            <tr>
              <th scope="col" className="px-4 py-3 text-left">
                Regulator
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Institutions
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Share
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {regulatorBreakdown.map((row) => (
              <tr key={row.regulator}>
                <td className="px-4 py-3 font-medium text-[#0A2540]">{row.regulator}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.count}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User scenarios */}
      <div className="grid gap-4 md:grid-cols-3">
        {scenarios.map((s) => (
          <article
            key={s.persona}
            className="rounded-2xl border border-[#D4AF37]/20 bg-amber-50/50 p-5"
          >
            <Users className="mb-2 h-5 w-5 text-amber-700" aria-hidden="true" />
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">
              {s.persona}
            </p>
            <h3 className="mt-1 font-semibold text-[#0A2540]">{s.headline}</h3>
            <p className="mt-2 text-sm text-zinc-600">{s.recommendation}</p>
            <Link
              href={s.ctaHref}
              className="mt-3 inline-block text-sm font-semibold text-[#00A3A1] hover:underline"
            >
              {s.ctaLabel} →
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}