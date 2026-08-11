import type { Lender } from '@/lib/mockData';
import { EvidenceBadges } from '@/components/research/evidence-badges';
import { computeLenderResearchSignals } from '@/lib/research/research-signals';
import { NetworkResearchStandard } from '@/components/network/network-research-standard';

type Props = {
  lender: Lender;
  compact?: boolean;
  className?: string;
  hmdaAvailable?: boolean;
  cfpbRecordAvailable?: boolean;
};

/**
 * Profile evidence panel — evidence chips first; no decorative 0–100 grade.
 * Composite math remains in methodology for transparency only.
 */
export function ResearchScoreDisplay({
  lender,
  compact = false,
  className = '',
  hmdaAvailable,
  cfpbRecordAvailable,
}: Props) {
  const s = computeLenderResearchSignals(lender);

  if (compact) {
    return (
      <div className={className}>
        <EvidenceBadges
          lender={lender}
          compact
          hmdaAvailable={hmdaAvailable}
          cfpbRecordAvailable={cfpbRecordAvailable}
        />
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 ${className}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
        Public research signals
      </p>
      <p className="mt-1 text-sm text-zinc-600">
        What we can show from re-checkable or attributed sources for this listing — not a grade,
        ranking, or approval odds.
      </p>
      <div className="mt-3">
        <EvidenceBadges
          lender={lender}
          compact={false}
          showAbsent
          hmdaAvailable={hmdaAvailable}
          cfpbRecordAvailable={cfpbRecordAvailable}
        />
      </div>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            NMLS / license status
          </dt>
          <dd className="mt-0.5 font-semibold text-[#0A2540]">
            {s.nmls.badgeLabel ?? 'Incomplete'}
          </dd>
          <dd className="mt-0.5 text-xs text-zinc-600">{s.nmls.summary}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Local market evidence
          </dt>
          <dd className="mt-0.5 font-semibold text-[#0A2540]">{s.localMarket.label}</dd>
          <dd className="mt-0.5 text-xs text-zinc-600">{s.localMarket.detail}</dd>
        </div>
      </dl>
      <p className="mt-4 text-xs leading-relaxed text-zinc-600">{s.doesNotMeasure}</p>
      <details className="mt-3 text-xs text-zinc-500">
        <summary className="cursor-pointer font-medium text-[#0A2540]">
          Optional: technical composite factors (not a public grade)
        </summary>
        <p className="mt-2 text-zinc-600">
          Internal composite for methodology transparency only. We do not present this as a
          ranking score on cards.
        </p>
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
      <div className="mt-4">
        <NetworkResearchStandard compact methodologyHref={s.methodologyPath} />
      </div>
    </div>
  );
}
