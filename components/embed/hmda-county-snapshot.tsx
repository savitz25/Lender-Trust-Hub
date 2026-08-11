import { ArrowUpRight } from 'lucide-react';
import type { HmdaCountyEvidence } from '@/lib/hmda';
import { EmbedAnalytics } from '@/components/embed/embed-analytics';

type Props = {
  evidence: HmdaCountyEvidence;
  deepLink: string;
  embedSrc?: string;
};

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
    <div className="rounded-lg border border-zinc-200/90 bg-white px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-0.5 text-lg font-bold tabular-nums tracking-tight text-[#0A2540] sm:text-xl">
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-[10px] leading-snug text-zinc-500">{hint}</p> : null}
    </div>
  );
}

/**
 * Stage C.1 — compact read-only HMDA county research card for embeds.
 */
export function HmdaCountySnapshot({ evidence, deepLink, embedSrc }: Props) {
  const mix = evidence.loanTypeMix;
  const topMix = (
    [
      { label: 'Conv', pct: mix.conventionalPct },
      { label: 'FHA', pct: mix.fhaPct },
      { label: 'VA', pct: mix.vaPct },
      { label: 'USDA', pct: mix.usdaPct },
    ] as const
  )
    .filter((r) => r.pct > 0)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3);

  return (
    <article
      className="mx-auto max-w-lg overflow-hidden rounded-2xl border border-[#0A2540]/12 bg-white shadow-sm"
      data-embed="hmda-county-snapshot"
      data-state={evidence.state}
      data-county={evidence.countySlug}
    >
      <EmbedAnalytics
        kind="hmda-county"
        state={evidence.state}
        county={evidence.countySlug}
        embedSrc={embedSrc}
        hasData
      />

      <header className="border-b border-[#0A2540]/10 bg-[#0A2540] px-4 py-3.5 text-white sm:px-5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-200/90">
          Mortgage market · HMDA · {evidence.year}
        </p>
        <h1 className="mt-1 text-base font-bold leading-snug sm:text-lg">
          {evidence.countyName} County, {evidence.state}
        </h1>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-200">
          Public-record activity snapshot · Not a score or ranking
        </p>
      </header>

      <div className="space-y-3 p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric
            label="Applications"
            value={evidence.applications.toLocaleString('en-US')}
          />
          <Metric
            label="Originations"
            value={evidence.originations.toLocaleString('en-US')}
          />
          <Metric
            label="Denial rate"
            value={`${evidence.denialRatePct.toFixed(1)}%`}
            hint="Denials ÷ applications"
          />
          <Metric
            label="Purchase / refi"
            value={`${evidence.purchasePct.toFixed(0)}% / ${evidence.refinancePct.toFixed(0)}%`}
            hint="Among those purposes"
          />
        </div>

        {topMix.length > 0 ? (
          <div className="rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Loan mix (originations)
            </p>
            <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-700">
              {topMix.map((r) => (
                <li key={r.label} className="tabular-nums">
                  <span className="font-semibold text-[#0A2540]">{r.label}</span>{' '}
                  {r.pct.toFixed(0)}%
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="text-[11px] leading-relaxed text-zinc-500">
          <span className="font-medium text-zinc-600">Source:</span> {evidence.source}. Public HMDA
          records (CFPB/FFIEC). Educational research only.
        </p>

        <p className="text-[11px] font-medium text-zinc-600">
          We show the public record. You decide.
        </p>

        <a
          href={deepLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A2540] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0d3356]"
          data-embed-cta="full-county-research"
          data-embed-src={embedSrc ?? ''}
        >
          Explore full {evidence.countyName} mortgage research
          <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
        </a>

        <p className="text-center text-[10px] text-zinc-400">
          Lender Trust Hub · research only · no lead form
        </p>
      </div>
    </article>
  );
}

export function HmdaCountySnapshotEmpty({
  stateLabel,
  countyLabel,
  hubHref,
  embedSrc,
  reason,
}: {
  stateLabel?: string;
  countyLabel?: string;
  hubHref: string;
  embedSrc?: string;
  reason: 'missing-params' | 'unknown-state' | 'no-data';
}) {
  const title =
    reason === 'missing-params'
      ? 'County snapshot needs state and county'
      : reason === 'unknown-state'
        ? 'State not recognized'
        : 'No HMDA panel for this county yet';

  const body =
    reason === 'missing-params'
      ? 'Use state and county query parameters (for example state=FL&county=miami-dade).'
      : reason === 'unknown-state'
        ? 'Check the state code or slug, then browse the full lender research directory.'
        : stateLabel && countyLabel
          ? `We do not publish a cleaned HMDA snapshot for ${countyLabel}, ${stateLabel} yet. Browse the directory for NMLS-oriented research.`
          : 'We do not publish a cleaned HMDA snapshot for this market yet.';

  return (
    <article
      className="mx-auto max-w-lg overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
      data-embed="hmda-county-snapshot"
      data-embed-empty={reason}
    >
      <EmbedAnalytics
        kind="hmda-county"
        state={stateLabel}
        county={countyLabel}
        embedSrc={embedSrc}
        hasData={false}
      />
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        Mortgage market · HMDA
      </p>
      <h1 className="mt-1 text-base font-bold text-[#0A2540]">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">{body}</p>
      <p className="mt-3 text-[11px] text-zinc-500">
        Research only · We show the public record when available. You decide.
      </p>
      <a
        href={hubHref}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#0A2540]/20 bg-zinc-50 px-4 py-3 text-sm font-semibold text-[#0A2540] hover:bg-zinc-100"
        data-embed-cta="hub-fallback"
      >
        Browse lender research
        <ArrowUpRight className="h-4 w-4" aria-hidden />
      </a>
    </article>
  );
}
