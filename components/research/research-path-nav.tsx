import Link from 'next/link';
import { ArrowRight, Columns3, FileSearch, Landmark, MapPin } from 'lucide-react';
import { analyzerCountyOptionSlug } from '@/lib/tools/loan-estimate-analyzer/county-option';
import { cn } from '@/lib/utils';

export type ResearchPathContext = {
  stateSlug?: string;
  stateName?: string;
  /** Raw county slug (e.g. orange) — not analyzer option slug */
  countySlug?: string;
  countyName?: string;
  lenderSlug?: string;
  lenderName?: string;
};

/**
 * Predictable research path links:
 * State hub → County market → Lender profile → Flagship tools
 * Research-first copy only — no lead-gen language.
 */
export function ResearchPathNav({
  context,
  variant = 'panel',
  className,
  heading = 'Continue your research',
}: {
  context: ResearchPathContext;
  variant?: 'panel' | 'compact' | 'tools';
  className?: string;
  heading?: string;
}) {
  const { stateSlug, stateName, countySlug, countyName, lenderSlug, lenderName } = context;
  const analyzerQ = new URLSearchParams();
  if (lenderSlug) analyzerQ.set('lender', lenderSlug);
  if (stateSlug && countySlug) {
    const opt = analyzerCountyOptionSlug(stateSlug, countySlug);
    if (opt) analyzerQ.set('county', opt);
  }
  const aq = analyzerQ.toString();
  const analyzeHref = aq
    ? `/tools/loan-estimate-analyzer?${aq}`
    : '/tools/loan-estimate-analyzer';
  const compareHref = aq
    ? `/tools/compare-loan-estimates?${aq}`
    : '/tools/compare-loan-estimates';
  const finderHref = stateSlug
    ? `/tools/program-finder?state=${encodeURIComponent(stateSlug)}`
    : '/tools/program-finder';

  const links: Array<{ href: string; label: string; detail: string; icon: typeof MapPin }> = [];

  if (stateSlug) {
    links.push({
      href: `/local-lenders/${stateSlug}`,
      label: stateName ? `${stateName} lenders` : 'State hub',
      detail: 'State directory · counties · tools',
      icon: MapPin,
    });
  }
  if (stateSlug && countySlug) {
    links.push({
      href: `/local-lenders/${stateSlug}/${countySlug}`,
      label: countyName ? `${countyName} County market` : 'County market',
      detail: 'In-county HQ inventory & HMDA context',
      icon: MapPin,
    });
  }
  if (lenderSlug) {
    links.push({
      href: `/lenders/${lenderSlug}`,
      label: lenderName || 'Lender profile',
      detail: 'NMLS path · evidence panels',
      icon: Landmark,
    });
  }

  links.push(
    {
      href: analyzeHref,
      label: 'Understand your Loan Estimate',
      detail: 'Fee bands & educational context',
      icon: FileSearch,
    },
    {
      href: compareHref,
      label: 'Compare offers side by side',
      detail: '2–3 Loan Estimates clearly',
      icon: Columns3,
    },
    {
      href: finderHref,
      label: 'Explore assistance programs',
      detail: 'FHA · VA · DPA research pathways',
      icon: Landmark,
    }
  );

  if (variant === 'compact') {
    return (
      <p className={cn('flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-600', className)}>
        {links.slice(0, 4).map((l, i) => (
          <span key={l.href} className="inline-flex items-center gap-2">
            {i > 0 ? <span className="text-zinc-300" aria-hidden>
              ·
            </span> : null}
            <Link href={l.href} className="font-semibold text-[#059669] hover:underline">
              {l.label}
            </Link>
          </span>
        ))}
      </p>
    );
  }

  return (
    <aside
      className={cn(
        'rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm',
        variant === 'tools' && 'border-emerald-200/80 bg-gradient-to-br from-emerald-50/40 via-white to-sky-50/30',
        className
      )}
      aria-labelledby="research-path-heading"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        Research path
      </p>
      <h2 id="research-path-heading" className="mt-1 text-lg font-bold text-[#0A2540]">
        {heading}
      </h2>
      <p className="mt-1 text-sm text-zinc-600">
        Predictable next steps: state hub → county market → lender profile → free tools. Educational
        only — not a lead form.
      </p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {links.map((l) => {
          const Icon = l.icon;
          return (
            <li key={l.href + l.label}>
              <Link
                href={l.href}
                className="group flex min-h-12 items-start gap-2.5 rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-2.5 hover:border-emerald-300 hover:bg-emerald-50/50"
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden />
                <span className="min-w-0">
                  <span className="flex items-center gap-1 text-sm font-semibold text-[#0A2540] group-hover:text-emerald-800">
                    {l.label}
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" aria-hidden />
                  </span>
                  <span className="block text-xs text-zinc-500">{l.detail}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
