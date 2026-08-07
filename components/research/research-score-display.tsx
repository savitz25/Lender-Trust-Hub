import Link from 'next/link';
import type { Lender } from '@/lib/mockData';
import { computeLenderResearchSignals } from '@/lib/research/research-signals';

type Props = {
  lender: Lender;
  compact?: boolean;
  className?: string;
};

export function ResearchScoreDisplay({ lender, compact = false, className = '' }: Props) {
  const s = computeLenderResearchSignals(lender);

  if (compact) {
    return (
      <div className={`text-xs text-zinc-500 ${className}`}>
        <span className="font-semibold text-[#0A2540]">Research {s.researchScore}</span>
        <span className="mx-1">·</span>
        <span>{s.dataConfidenceLabel}</span>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-zinc-200 bg-white p-4 ${className}`}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Research Score
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-[#0A2540]">
            {s.researchScore}
            <span className="text-sm font-normal text-zinc-400"> / 100</span>
          </p>
          <p className="mt-1 text-xs text-zinc-500">{s.measures}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Data Confidence
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-[#0A2540]">
            {s.dataConfidence}
            <span className="text-sm font-normal text-zinc-400"> / 100</span>
          </p>
          <p className="mt-1 text-xs text-zinc-500">{s.dataConfidenceLabel}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            NMLS / License Status
          </p>
          <p className="mt-1 text-sm font-semibold text-[#0A2540]">
            {s.nmls.badgeLabel ?? 'Incomplete'}
          </p>
          <p className="mt-1 text-xs text-zinc-500">{s.nmls.summary}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Local Market Evidence
          </p>
          <p className="mt-1 text-sm font-semibold text-[#0A2540]">{s.localMarket.label}</p>
          <p className="mt-1 text-xs text-zinc-500">{s.localMarket.detail}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-zinc-500">
        {s.doesNotMeasure}{' '}
        <Link href={s.methodologyPath} className="font-medium text-[#059669] hover:underline">
          Methodology
        </Link>
      </p>
      {!compact && s.factors.length > 0 ? (
        <details className="mt-3 text-xs text-zinc-500">
          <summary className="cursor-pointer font-medium text-[#0A2540]">Score factors</summary>
          <ul className="mt-2 space-y-1">
            {s.factors.map((f) => (
              <li key={f.id}>
                <span className="font-medium text-zinc-700">
                  {f.label}: {f.points}/{f.maxPoints}
                </span>
                {' — '}
                {f.detail}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
