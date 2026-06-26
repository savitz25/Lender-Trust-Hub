import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { FDIC_CATEGORY, MORTGAGE_CATEGORY } from '@/lib/directory/categories';

type Vertical = 'fdic' | 'mortgage' | 'auto';

const BANNER_COPY: Record<
  Vertical,
  {
    audience: string;
    body: (state: string, top?: string) => string;
    cta: string;
    href: (slug: string) => string;
  }
> = {
  fdic: {
    audience: 'residents',
    body: (state, top) =>
      top
        ? `Start with ${top} or filter for banks headquartered in ${state}. Then compare mortgage lenders and auto loan rates.`
        : `Filter for banks headquartered in ${state} for local branch access. Then compare mortgage lenders and use our free calculators.`,
    cta: 'Explore Mortgage Lenders →',
    href: (slug) => MORTGAGE_CATEGORY.statePath(slug),
  },
  mortgage: {
    audience: 'homebuyers',
    body: (state, top) =>
      `Compare NMLS-verified lenders by county experience score.${top ? ` Top rated: ${top}.` : ''} Pair with our FDIC bank directory for deposit safety.`,
    cta: 'Try Calculators →',
    href: () => '/calculators',
  },
  auto: {
    audience: 'drivers',
    body: (state, top) =>
      `Compare verified auto lenders by APR range and trust score.${top ? ` Top rated: ${top}.` : ''} Cross-check FDIC banks for your down payment account.`,
    cta: 'Explore FDIC Banks →',
    href: (slug) => FDIC_CATEGORY.statePath(slug),
  },
};

/**
 * Context-aware personalization — A/B friendly via data-variant.
 * Server-rendered for SEO; swap copy per vertical in props.
 */
export function PersonalizedBanner({
  stateName,
  stateSlug,
  vertical = 'fdic',
  topEntityName,
  variant = 'default',
}: {
  stateName: string;
  stateSlug: string;
  vertical?: Vertical;
  topEntityName?: string;
  variant?: string;
}) {
  const config = BANNER_COPY[vertical];

  return (
    <aside
      data-variant={variant}
      data-vertical={vertical}
      className="mb-8 rounded-2xl border border-[#D4AF37]/25 bg-gradient-to-r from-amber-50 to-white p-5 md:flex md:items-center md:justify-between md:gap-6"
    >
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">
            Recommended for {stateName} {config.audience}
          </p>
          <p className="mt-1 text-sm text-zinc-700">
            {config.body(stateName, topEntityName)}
          </p>
        </div>
      </div>
      <Link
        href={config.href(stateSlug)}
        prefetch
        className="mt-4 inline-flex shrink-0 rounded-xl bg-[#0A2540] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0d3a5c] md:mt-0"
      >
        {config.cta}
      </Link>
    </aside>
  );
}