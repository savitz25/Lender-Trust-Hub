import Link from 'next/link';
import { ArrowRight, Building2, Landmark, Calculator } from 'lucide-react';
import { DIRECTORY_CATEGORIES, FDIC_CATEGORY, MORTGAGE_CATEGORY } from '@/lib/directory/categories';

const ICONS = { fdic: Landmark, mortgage: Building2, calculators: Calculator } as const;

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
  activeVertical?: 'fdic' | 'mortgage';
}) {
  const items = [
    {
      id: 'fdic' as const,
      label: stateName ? `FDIC Banks in ${stateName}` : 'FDIC Insured Banks',
      href: stateSlug ? FDIC_CATEGORY.statePath(stateSlug) : FDIC_CATEGORY.hubPath,
      icon: ICONS.fdic,
      description: 'Verified deposit institutions',
    },
    {
      id: 'mortgage' as const,
      label: stateName ? `Mortgage Lenders in ${stateName}` : 'Mortgage Lenders',
      href: stateSlug ? MORTGAGE_CATEGORY.statePath(stateSlug) : MORTGAGE_CATEGORY.hubPath,
      icon: ICONS.mortgage,
      description: 'NMLS verified brokers & lenders',
    },
    {
      id: 'calculators' as const,
      label: 'Mortgage Calculators',
      href: '/calculators',
      icon: ICONS.calculators,
      description: 'Free payment & affordability tools',
    },
  ];

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
      <p className="mt-3 text-[10px] text-zinc-400">
        Also coming: {DIRECTORY_CATEGORIES.auto.labelShort}, Credit Repair, MCA
      </p>
    </nav>
  );
}