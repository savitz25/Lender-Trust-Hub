import Link from 'next/link';
import { ArrowRight, Landmark } from 'lucide-react';
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

  if (variant === 'compact') {
    return (
      <p className={cn('text-sm text-zinc-600', className)}>
        <Link href={finderHref} className="font-semibold text-[#059669] hover:underline">
          Program / assistance finder
        </Link>
        <span className="mx-1.5 text-zinc-300">·</span>
        <Link href="/programs" className="font-semibold text-[#059669] hover:underline">
          FHA, VA, DPA overviews
        </Link>
      </p>
    );
  }

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
      </p>
      <h2 id="programs-cta-heading" className="mt-1 text-lg font-bold text-[#0A2540]">
        Exploring FHA, VA, or down-payment help?
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">
        Compare common program themes—down payment ranges, insurance concepts, and when people
        research each path. Not an eligibility decision. We show the public record. You decide.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link
          href={finderHref}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0A2540] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0A2540]/90"
        >
          <Landmark className="h-4 w-4" aria-hidden />
          Open program finder
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        <Link
          href="/programs"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#0A2540] hover:border-sky-400"
        >
          Browse program overviews
        </Link>
      </div>
    </aside>
  );
}
