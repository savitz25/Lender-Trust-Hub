import Link from 'next/link';
import { Compass } from 'lucide-react';
import { FDIC_CATEGORY, MORTGAGE_CATEGORY } from '@/lib/directory/categories';

type Vertical = 'fdic' | 'mortgage' | 'auto';

const BANNER_COPY: Record<
  Vertical,
  {
    audience: string;
    body: (state: string) => string;
    cta: string;
    href: (slug: string) => string;
  }
> = {
  fdic: {
    audience: 'deposit research',
    body: (state) =>
      `Filter for banks headquartered in ${state} when local branch access matters. Then compare mortgage lenders and educational calculators.`,
    cta: 'Explore mortgage lenders →',
    href: (slug) => MORTGAGE_CATEGORY.statePath(slug),
  },
  mortgage: {
    audience: 'home financing research',
    body: (state) =>
      `Browse NMLS-oriented mortgage companies in ${state} with locality-honest county pages. Pair with FDIC bank research for deposit safety.`,
    cta: 'Open calculators →',
    href: () => '/calculators',
  },
  auto: {
    audience: 'auto financing research',
    body: (state) =>
      `Compare auto financing companies in ${state} by published APR ranges. Cross-check FDIC banks if you need a down-payment account.`,
    cta: 'Explore FDIC banks →',
    href: (slug) => FDIC_CATEGORY.statePath(slug),
  },
};

/**
 * Context-aware research handoff — evidence-based framing only.
 * No “top rated” / “recommended winner” language.
 */
export function PersonalizedBanner({
  stateName,
  stateSlug,
  vertical = 'fdic',
  topEntityName: _topEntityName,
  variant = 'default',
}: {
  stateName: string;
  stateSlug: string;
  vertical?: Vertical;
  /** @deprecated Ignored — naming an entity “top” implied a ranking award */
  topEntityName?: string;
  variant?: string;
}) {
  void _topEntityName;
  const config = BANNER_COPY[vertical];

  return (
    <aside
      data-variant={variant}
      data-vertical={vertical}
      className="mb-8 rounded-2xl border border-zinc-200 bg-gradient-to-r from-slate-50 to-white p-5 md:flex md:items-center md:justify-between md:gap-6"
    >
      <div className="flex items-start gap-3">
        <Compass className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" aria-hidden="true" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Research path · {stateName} {config.audience}
          </p>
          <p className="mt-1 text-sm text-zinc-700">{config.body(stateName)}</p>
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
