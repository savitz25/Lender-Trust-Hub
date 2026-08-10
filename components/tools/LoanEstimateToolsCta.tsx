import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, Columns3, FileSearch } from 'lucide-react';
import { cn } from '@/lib/utils';

export type LoanEstimateToolsCtaVariant =
  | 'hub' // calculators hub featured strip
  | 'profile' // lender profile
  | 'county' // county / local page
  | 'compact' // small inline dual links
  | 'banner'; // homepage-style dual cards

function analyzerHref(lenderSlug?: string, countySlug?: string): string {
  const q = new URLSearchParams();
  if (lenderSlug) q.set('lender', lenderSlug);
  if (countySlug) q.set('county', countySlug);
  const s = q.toString();
  return s ? `/tools/loan-estimate-analyzer?${s}` : '/tools/loan-estimate-analyzer';
}

function compareHref(lenderSlug?: string, countySlug?: string): string {
  const q = new URLSearchParams();
  if (lenderSlug) q.set('lender', lenderSlug);
  if (countySlug) q.set('county', countySlug);
  const s = q.toString();
  return s ? `/tools/compare-loan-estimates?${s}` : '/tools/compare-loan-estimates';
}

/**
 * Light discovery CTAs for Loan Estimate Analyzer + Compare tools.
 * Research framing only — no lead capture language.
 */
export function LoanEstimateToolsCta({
  variant = 'banner',
  lenderSlug,
  countySlug,
  lenderName,
  countyName,
  className,
}: {
  variant?: LoanEstimateToolsCtaVariant;
  lenderSlug?: string;
  countySlug?: string;
  lenderName?: string;
  countyName?: string;
  className?: string;
}) {
  const analyze = analyzerHref(lenderSlug, countySlug);
  const compare = compareHref(lenderSlug, countySlug);

  if (variant === 'compact') {
    return (
      <p className={cn('text-sm text-zinc-600', className)}>
        <Link href={analyze} className="font-semibold text-[#059669] hover:underline">
          Understand your Loan Estimate
        </Link>
        <span className="mx-1.5 text-zinc-300">·</span>
        <Link href={compare} className="font-semibold text-[#059669] hover:underline">
          Compare offers side by side
        </Link>
        <span className="mt-0.5 block text-xs text-zinc-500">No phone number required</span>
      </p>
    );
  }

  if (variant === 'profile') {
    return (
      <aside
        className={cn(
          'mt-8 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 via-white to-sky-50/50 p-5 shadow-sm md:p-6',
          className
        )}
        aria-labelledby="le-tools-profile-heading"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
          Free research tools · No phone required
        </p>
        <h2 id="le-tools-profile-heading" className="mt-1 text-lg font-bold text-[#0A2540]">
          {lenderName
            ? `Have a Loan Estimate from ${lenderName}?`
            : 'Have a Loan Estimate from this lender?'}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          Understand your Loan Estimate with educational fee bands and optional HMDA context
          {lenderName ? ` for ${lenderName}` : ''}. Compare offers side by side when you have more
          than one. Save research to My Lending when you want to return later.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link
            href={analyze}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0A2540] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0A2540]/90"
          >
            <FileSearch className="h-4 w-4" aria-hidden="true" />
            Understand your Loan Estimate
          </Link>
          <Link
            href={compare}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#0A2540] hover:border-emerald-400"
          >
            <Columns3 className="h-4 w-4" aria-hidden="true" />
            Compare offers side by side
          </Link>
          <Link
            href="/my-lending"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-transparent px-4 py-2.5 text-sm font-semibold text-emerald-800 underline-offset-2 hover:underline"
          >
            Save your research
          </Link>
        </div>
      </aside>
    );
  }

  if (variant === 'county') {
    const place = countyName ? `${countyName} County` : 'this market';
    return (
      <aside
        className={cn(
          'mb-10 rounded-2xl border border-sky-200/80 bg-gradient-to-br from-sky-50/80 via-white to-emerald-50/40 p-5 shadow-sm md:p-6',
          className
        )}
        aria-labelledby="le-tools-county-heading"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-sky-900">
          While you research {place}
        </p>
        <h2 id="le-tools-county-heading" className="mt-1 text-lg font-bold text-[#0A2540]">
          Understand your Loan Estimate
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">
          If you already have offers, analyze fees and terms—or compare two or three Loan Estimates
          side by side. Educational research only
          {countySlug ? ', with optional multi-state HMDA market context when available' : ''}. No
          phone number required.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link
            href={analyze}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Analyze a Loan Estimate
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href={compare}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#0A2540] hover:border-sky-400"
          >
            Compare offers side by side
          </Link>
        </div>
      </aside>
    );
  }

  if (variant === 'hub') {
    return (
      <section
        className={cn('mb-10', className)}
        aria-labelledby="le-tools-hub-heading"
      >
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Flagship research tools
            </p>
            <h2 id="le-tools-hub-heading" className="text-xl font-bold text-[#0A2540] md:text-2xl">
              Already have a Loan Estimate?
            </h2>
          </div>
          <p className="text-xs text-zinc-500">No phone number · No lead form</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <ToolCard
            href={analyze}
            icon={<FileSearch className="h-7 w-7 text-emerald-600" aria-hidden="true" />}
            title="Understand your Loan Estimate"
            description="Fee bands, points vs rate, optional multi-state HMDA context — then save research to My Lending."
            cta="Open analyzer"
            featured
          />
          <ToolCard
            href={compare}
            icon={<Columns3 className="h-7 w-7 text-sky-600" aria-hidden="true" />}
            title="Compare offers side by side"
            description="2–3 Loan Estimates — rate, origination, points, credits, and monthly P&I. Save a comparison when ready."
            cta="Open comparison"
            featured
          />
        </div>
        <p className="mt-3 text-center text-sm text-zinc-500">
          Also:{' '}
          <Link href="/tools/program-finder" className="font-semibold text-[#059669] hover:underline">
            Explore programs
          </Link>
          {' · '}
          <Link href="/my-lending" className="font-semibold text-[#059669] hover:underline">
            Save your research
          </Link>
        </p>
      </section>
    );
  }

  // banner (homepage / general)
  return (
    <section
      className={cn(
        'rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 via-white to-sky-50/50 p-5 shadow-sm sm:p-6',
        className
      )}
      aria-labelledby="le-tools-banner-heading"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
        Free · No phone number required
      </p>
      <h2 id="le-tools-banner-heading" className="mt-1 text-xl font-bold text-[#0A2540]">
        Already have a Loan Estimate?
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">
        See how fees and terms differ with clear educational framing—or compare two or three offers
        side by side. Independent research tools, not a lead marketplace.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <ToolCard
          href={analyze}
          icon={<FileSearch className="h-6 w-6 text-emerald-600" aria-hidden="true" />}
          title="Understand your Loan Estimate"
          description="Fee bands, points vs rate, optional HMDA context."
          cta="Analyze LE"
          compact
        />
        <ToolCard
          href={compare}
          icon={<Columns3 className="h-6 w-6 text-sky-600" aria-hidden="true" />}
          title="Compare offers side by side"
          description="2–3 Loan Estimates — rate, fees, credits, P&I."
          cta="Compare LEs"
          compact
        />
      </div>
    </section>
  );
}

function ToolCard({
  href,
  icon,
  title,
  description,
  cta,
  featured,
  compact,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
  cta: string;
  featured?: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex h-full flex-col rounded-xl border bg-white p-4 transition hover:border-emerald-300 hover:shadow-md sm:p-5',
        featured
          ? 'border-emerald-200 shadow-sm ring-1 ring-emerald-100'
          : 'border-zinc-200'
      )}
    >
      <div className="mb-2">{icon}</div>
      <h3 className="font-bold text-[#0A2540] group-hover:text-emerald-800">{title}</h3>
      <p className={cn('mt-1 flex-1 text-zinc-500', compact ? 'text-xs' : 'text-sm')}>
        {description}
      </p>
      <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
        {cta}
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
    </Link>
  );
}
