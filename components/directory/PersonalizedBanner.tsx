import Link from 'next/link';
import { Sparkles } from 'lucide-react';

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
  vertical?: 'fdic' | 'mortgage';
  topEntityName?: string;
  variant?: string;
}) {
  const isFdic = vertical === 'fdic';

  return (
    <aside
      data-variant={variant}
      className="mb-8 rounded-2xl border border-[#D4AF37]/25 bg-gradient-to-r from-amber-50 to-white p-5 md:flex md:items-center md:justify-between md:gap-6"
    >
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-800">
            Recommended for {stateName} {isFdic ? 'residents' : 'homebuyers'}
          </p>
          <p className="mt-1 text-sm text-zinc-700">
            {isFdic ? (
              <>
                {topEntityName
                  ? `Start with ${topEntityName} or filter for banks headquartered in ${stateName}.`
                  : `Filter for banks headquartered in ${stateName} for local branch access.`}
                {' '}Then compare mortgage lenders and use our free calculators.
              </>
            ) : (
              <>
                Compare NMLS-verified lenders by county experience score.
                {topEntityName ? ` Top rated: ${topEntityName}.` : ''}
                {' '}Pair with our FDIC bank directory for deposit safety.
              </>
            )}
          </p>
        </div>
      </div>
      <Link
        href={isFdic ? `/local-lenders/${stateSlug}` : '/calculators'}
        prefetch
        className="mt-4 inline-flex shrink-0 rounded-xl bg-[#0A2540] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0d3a5c] md:mt-0"
      >
        {isFdic ? 'Explore Mortgage Lenders →' : 'Try Calculators →'}
      </Link>
    </aside>
  );
}