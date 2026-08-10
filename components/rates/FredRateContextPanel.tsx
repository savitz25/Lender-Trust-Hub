'use client';

import { Info, TrendingUp } from 'lucide-react';
import {
  compareUserRateToBenchmarks,
  formatBenchmarkRate,
  type FredMortgageBenchmarks,
  type RateBenchmarkTone,
} from '@/lib/fred';
import { cn } from '@/lib/utils';

function toneStyles(tone: RateBenchmarkTone): string {
  switch (tone) {
    case 'below':
      return 'border-emerald-200 bg-emerald-50/70';
    case 'near':
      return 'border-sky-200 bg-sky-50/70';
    case 'above':
      return 'border-amber-200 bg-amber-50/60';
    default:
      return 'border-zinc-200 bg-zinc-50';
  }
}

/**
 * Reusable FRED / Freddie Mac rate context.
 * Pass server-fetched benchmarks as props — never fetch with the API key on the client.
 */
export function FredRateContextPanel({
  benchmarks,
  userRate,
  compact = false,
  className,
}: {
  benchmarks: FredMortgageBenchmarks | null | undefined;
  /** When set, show comparison framing against the national 30-year average. */
  userRate?: number | null;
  compact?: boolean;
  className?: string;
}) {
  if (!benchmarks?.available || (!benchmarks.rate30 && !benchmarks.rate15)) {
    return null;
  }

  const primary = benchmarks.rate30 ?? benchmarks.rate15!;
  const comparison =
    userRate != null && Number.isFinite(userRate) && userRate > 0
      ? compareUserRateToBenchmarks(userRate, benchmarks)
      : null;

  return (
    <div
      className={cn(
        'rounded-xl border p-4',
        comparison ? toneStyles(comparison.tone) : 'border-zinc-200 bg-white',
        className
      )}
      aria-label="National mortgage rate benchmark context"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <TrendingUp
            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700"
            aria-hidden="true"
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Market rate context
            </p>
            <p className="mt-0.5 text-sm font-semibold text-[#0A2540]">
              National {primary.seriesId === 'MORTGAGE15US' ? '15-year' : '30-year'} fixed average
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tabular-nums text-[#0A2540]">
            {formatBenchmarkRate(primary.value)}
          </p>
          <p className="text-xs text-zinc-500">as of {primary.date}</p>
        </div>
      </div>

      {!compact && benchmarks.rate15 && benchmarks.rate30 ? (
        <p className="mt-2 text-xs text-zinc-600">
          15-year national average:{' '}
          <span className="font-semibold tabular-nums text-[#0A2540]">
            {formatBenchmarkRate(benchmarks.rate15.value)}
          </span>{' '}
          <span className="text-zinc-500">(as of {benchmarks.rate15.date})</span>
        </p>
      ) : null}

      {comparison ? (
        <p className="mt-3 text-sm leading-relaxed text-zinc-800">{comparison.framing}</p>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-zinc-600">
          Use this national average as a research benchmark when reading a Loan Estimate interest
          rate. It is not a personalized offer and will not match every product, credit tier, or
          market.
        </p>
      )}

      <p className="mt-3 flex gap-2 text-xs leading-relaxed text-zinc-500">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>
          Source:{' '}
          <a
            href={benchmarks.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#3B82F6] underline-offset-2 hover:underline"
          >
            {benchmarks.sourceLabel}
          </a>
          . {benchmarks.note} We show the public record. You decide.
        </span>
      </p>
    </div>
  );
}

/** Compact strip for calculator hubs — benchmark only, no comparison. */
export function FredRateBenchmarkStrip({
  benchmarks,
  className,
}: {
  benchmarks: FredMortgageBenchmarks | null | undefined;
  className?: string;
}) {
  if (!benchmarks?.available || !benchmarks.rate30) return null;

  return (
    <div
      className={cn(
        'rounded-xl border border-emerald-200/80 bg-emerald-50/50 px-4 py-3 text-sm text-zinc-700',
        className
      )}
    >
      <span className="font-semibold text-[#0A2540]">
        Current national 30-year average:{' '}
        <span className="tabular-nums">{formatBenchmarkRate(benchmarks.rate30.value)}</span>
      </span>
      <span className="text-zinc-500"> · as of {benchmarks.rate30.date}</span>
      <span className="mt-1 block text-xs text-zinc-500">
        Source:{' '}
        <a
          href={benchmarks.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[#059669] hover:underline"
        >
          {benchmarks.sourceLabel}
        </a>
        . Research benchmark only — not a personalized quote.
      </span>
    </div>
  );
}
