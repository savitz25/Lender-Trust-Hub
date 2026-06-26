import Link from 'next/link';
import {
  FDIC_CATEGORY,
  MORTGAGE_CATEGORY,
  AUTO_CATEGORY,
} from '@/lib/directory/categories';

/**
 * Internal link mesh for lender profiles — critical for crawl depth and authority.
 */
export function RelatedDirectoryLinks({
  stateSlug,
  stateName,
}: {
  stateSlug: string;
  stateName: string;
}) {
  const links = [
    {
      label: `FDIC Insured Banks in ${stateName}`,
      href: FDIC_CATEGORY.statePath(stateSlug),
      description: 'Verify deposit insurance before you borrow',
    },
    {
      label: `Mortgage Lenders in ${stateName}`,
      href: MORTGAGE_CATEGORY.statePath(stateSlug),
      description: 'NMLS verified brokers & lenders',
    },
    {
      label: `Auto Loan Companies in ${stateName}`,
      href: AUTO_CATEGORY.statePath(stateSlug),
      description: 'Compare APR ranges & trust scores',
    },
    {
      label: 'Free Mortgage Calculators',
      href: '/calculators',
      description: 'Payment, affordability & refinance tools',
    },
  ];

  return (
    <aside
      aria-labelledby="related-directory-heading"
      className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-6"
    >
      <h2 id="related-directory-heading" className="text-sm font-bold uppercase tracking-wider text-zinc-400">
        Related Directories in {stateName}
      </h2>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} prefetch className="group block">
              <span className="font-semibold text-[#0A2540] group-hover:text-[#00A3A1]">
                {link.label} →
              </span>
              <span className="mt-0.5 block text-xs text-zinc-500">{link.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}