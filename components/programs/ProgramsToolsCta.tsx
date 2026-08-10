import Link from 'next/link';
import { ArrowRight, Landmark } from 'lucide-react';
import { dpaStateCtaCopy, isDpaPriorityState } from '@/lib/programs/location-notes';
import { cn } from '@/lib/utils';

/** Discovery CTA for program explainers + finder — research framing only. */
export function ProgramsToolsCta({
  className,
  variant = 'banner',
  stateSlug,
}: {
  className?: string;
  variant?: 'banner' | 'compact' | 'county';
  stateSlug?: string;
}) {
  const finderHref = stateSlug
    ? `/tools/program-finder?state=${encodeURIComponent(stateSlug)}`
    : '/tools/program-finder';
  const dpaPriority = isDpaPriorityState(stateSlug);
  const dpaHint = stateSlug ? dpaStateCtaCopy(stateSlug) : null;
  const dpaHref =
    stateSlug && dpaPriority
      ? `/programs/down-payment-assistance#${stateSlug}`
      : '/programs/down-payment-assistance';

  if (variant === 'compact') {
    return (
      <p className={cn('text-sm text-zinc-600', className)}>
        <Link href={finderHref} className="font-semibold text-[#059669] hover:underline">
          Program / assistance finder
        </Link>
        <span className="mx-1.5 text-zinc-300">·</span>
        <Link href={dpaHref} className="font-semibold text-[#059669] hover:underline">
          {dpaPriority ? 'Local DPA research starts' : 'FHA, VA, DPA overviews'}
        </Link>
      </p>
    );
  }

  const stateLabel =
    stateSlug === 'florida'
      ? 'Florida'
      : stateSlug === 'texas'
        ? 'Texas'
        : stateSlug === 'georgia'
          ? 'Georgia'
          : null;
  const title = dpaPriority
    ? `Exploring FHA, VA, or ${stateLabel} assistance?`
    : stateLabel
      ? `Exploring FHA, VA, or programs in ${stateLabel}?`
      : 'Exploring FHA, VA, or down-payment help?';

  const body = dpaPriority
    ? `${dpaHint ?? ''} Open the program finder with your state pre-filled, or go to official-source starting points for down-payment assistance. Not an eligibility decision. We show the public record. You decide.`
    : 'Explore programs with clear trade-offs—down payment themes, insurance concepts, and when people research each path. Not an eligibility decision. We show the public record. You decide.';

  return (
    <aside
      className={cn(
        'rounded-2xl border border-sky-200/80 bg-gradient-to-br from-sky-50/80 via-white to-emerald-50/40 p-5 shadow-sm md:p-6',
        className
      )}
      aria-labelledby="programs-cta-heading"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-sky-900">
        Educational programs · No application form
        {variant === 'county' && dpaPriority ? ' · Assistance research pathway' : ''}
      </p>
      <h2 id="programs-cta-heading" className="mt-1 text-lg font-bold text-[#0A2540]">
        {title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">{body}</p>
      {dpaPriority ? (
        <p className="mt-2 text-xs text-zinc-500">
          County-level assistance may exist separately and is not fully listed here—start with
          official statewide portals, then local housing departments if needed.
        </p>
      ) : null}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link
          href={finderHref}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0A2540] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0A2540]/90"
        >
          <Landmark className="h-4 w-4" aria-hidden />
          {dpaPriority || stateLabel ? 'Explore programs' : 'Open program finder'}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        <Link
          href={dpaHref}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#0A2540] hover:border-sky-400"
        >
          {dpaPriority ? 'DPA official starting points' : 'Down-payment assistance guide'}
        </Link>
        <Link
          href="/programs"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#0A2540] hover:border-sky-400"
        >
          FHA · VA · DPA guides
        </Link>
        <Link
          href="/my-lending"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-transparent px-4 py-2.5 text-sm font-semibold text-sky-900 underline-offset-2 hover:underline"
        >
          Save your research
        </Link>
      </div>
    </aside>
  );
}
