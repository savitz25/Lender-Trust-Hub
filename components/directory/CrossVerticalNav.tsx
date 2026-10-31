import Link from 'next/link';
import { ArrowRight, Building2, Landmark, Calculator, Car } from 'lucide-react';
import {
  DIRECTORY_CATEGORIES,
  FDIC_CATEGORY,
  MORTGAGE_CATEGORY,
  AUTO_CATEGORY,
} from '@/lib/directory/categories';
import {
  publishedAutoStatePath,
  publishedFdicStatePath,
  publishedMortgageStatePath,
} from '@/lib/directory/published-state-routes';

const ICONS = {
  fdic: Landmark,
  mortgage: Building2,
  auto: Car,
  calculators: Calculator,
} as const;

type ActiveVertical = 'fdic' | 'mortgage' | 'auto';

/**
 * Cross-vertical navigation — critical for internal linking authority.
 * Place on every state page and national hub.
 */
export function CrossVerticalNav({
  stateSlug,
  stateName,
  activeVertical = 'fdic',
}: {
  stateSlug?: string;
  stateName?: string;
  activeVertical?: ActiveVertical;
}) {
  const fdicHref = stateSlug ? publishedFdicStatePath(stateSlug) : FDIC_CATEGORY.hubPath;
  const mortgageHref = stateSlug
    ? publishedMortgageStatePath(stateSlug)
    : MORTGAGE_CATEGORY.hubPath;
  const autoHref = stateSlug ? publishedAutoStatePath(stateSlug) : AUTO_CATEGORY.hubPath;
  const items: {
    id: ActiveVertical | 'calculators';
    label: string;
    href: string;
    icon: typeof ICONS[keyof typeof ICONS];
    description: string;
  }[] = [
    ...(fdicHref
      ? [{
          id: 'fdic' as const,
          label: stateName ? `FDIC Banks in ${stateName}` : 'FDIC Insured Banks',
          href: fdicHref,
          icon: ICONS.fdic,
          description: 'Verified deposit institutions',
        }]
      : []),
    ...(mortgageHref
      ? [{
          id: 'mortgage' as const,
          label: stateName ? `Mortgage Lenders in ${stateName}` : 'Mortgage Lenders',
          href: mortgageHref,
          icon: ICONS.mortgage,
          description: 'NMLS-oriented research directory',
        }]
      : []),
    ...(autoHref
      ? [{
          id: 'auto' as const,
          label: stateName ? `Auto Loans in ${stateName}` : 'Auto Loan Companies',
          href: autoHref,
          icon: ICONS.auto,
          description: 'Compare APR ranges & research scores',
        }]
      : []),
    {
      id: 'calculators',
      label: 'Mortgage Calculators',
      href: '/calculators',
      icon: ICONS.calculators,
      description: 'Free payment & affordability tools',
    },
  ];

  const comingSoon = [
    DIRECTORY_CATEGORIES['credit-repair'].labelShort,
    DIRECTORY_CATEGORIES.mca.labelShort,
  ].join(' · ');

  return (
    <nav aria-label="Directory categories" className="rounded-2xl border border-zinc-200 bg-white p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
        Explore LenderTrustHub
      </p>
      <ul className="space-y-2">
        {items.map((item) => {
          const isActive = item.id === activeVertical;
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                prefetch
                className={`flex items-center justify-between rounded-xl px-4 py-3 transition ${
                  isActive
                    ? 'bg-[#00A3A1]/10 ring-1 ring-[#00A3A1]/30'
                    : 'hover:bg-zinc-50'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5 text-[#00A3A1]" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-[#0A2540]">{item.label}</p>
                    <p className="text-xs text-zinc-500">{item.description}</p>
                  </div>
                </div>
                {!isActive && (
                  <ArrowRight className="h-4 w-4 text-zinc-400" aria-hidden="true" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-[10px] text-zinc-400">Also coming: {comingSoon}</p>
    </nav>
  );
}