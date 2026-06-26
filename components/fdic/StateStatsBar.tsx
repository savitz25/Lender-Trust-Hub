'use client';

import { Building2, Landmark, Shield, TrendingUp } from 'lucide-react';
import type { StateMeta } from '@/lib/fdic/types';
import { computeExtendedStateStats, formatInsuredDate, getRegulatorLabel } from '@/lib/fdic/utils';
import type { FDICBank } from '@/lib/fdic/types';
import { AnimatedCounter } from '@/components/fdic/AnimatedCounter';

export function StateStatsBar({
  banks,
  stateMeta,
}: {
  banks: FDICBank[];
  stateMeta: StateMeta;
}) {
  const stats = computeExtendedStateStats(banks, stateMeta.code);

  const cards = [
    {
      icon: Building2,
      label: 'Total Institutions',
      value: stats.total,
      animated: true,
      sub: `Serving ${stateMeta.fullName}`,
    },
    {
      icon: Landmark,
      label: 'Headquartered Here',
      value: stats.headquartered,
      animated: true,
      sub: `Banks with HQ in ${stateMeta.code}`,
    },
    {
      icon: Shield,
      label: 'Oldest Insured',
      value: stats.oldest ? formatInsuredDate(stats.oldest.fdic_insured_since) : '—',
      sub: stats.oldest?.name ? truncate(stats.oldest.name, 28) : '',
    },
    {
      icon: TrendingUp,
      label: 'Top Regulator',
      value: stats.topRegulator ? getRegulatorLabel(stats.topRegulator.key) : '—',
      sub: stats.topRegulator ? `${stats.topRegulator.count} institutions` : '',
    },
  ];

  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-[#00A3A1]/40 hover:shadow-md"
        >
          <card.icon className="mb-3 h-6 w-6 text-[#00A3A1]" aria-hidden="true" />
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{card.label}</p>
          <p className="mt-1 text-2xl font-bold text-[#0A2540]">
            {card.animated && typeof card.value === 'number' ? (
              <AnimatedCounter value={card.value} />
            ) : (
              card.value
            )}
          </p>
          {card.sub && <p className="mt-1 text-xs text-zinc-500">{card.sub}</p>}
        </div>
      ))}
    </div>
  );
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}