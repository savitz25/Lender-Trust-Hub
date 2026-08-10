import Link from 'next/link';
import {
  FDIC_CATEGORY,
  MORTGAGE_CATEGORY,
  AUTO_CATEGORY,
} from '@/lib/directory/categories';

/** Related research links on lender profiles. */
export function RelatedDirectoryLinks({
  stateSlug,
  stateName,
}: {
  stateSlug: string;
  stateName: string;
}) {
  const links = [
    {
      label: `Mortgage lenders in ${stateName}`,
      href: MORTGAGE_CATEGORY.statePath(stateSlug),
      description: 'State hub · county markets · HMDA evidence',
    },
    {
      label: 'Understand your Loan Estimate',
      href: '/tools/loan-estimate-analyzer',
      description: 'Fee bands, points vs rate, educational market context',
    },
    {
      label: 'Compare offers side by side',
      href: '/tools/compare-loan-estimates',
      description: 'See how fees and terms differ across two or three offers',
    },
    {
      label: 'Explore assistance programs',
      href: `/tools/program-finder?state=${encodeURIComponent(stateSlug)}`,
      description: 'FHA, VA, conventional, USDA, and DPA research pathways',
    },
    {
      label: `FDIC insured banks in ${stateName}`,
      href: FDIC_CATEGORY.statePath(stateSlug),
      description: 'Confirm deposit insurance context before you bank or close',
    },
    {
      label: `Auto loan companies in ${stateName}`,
      href: AUTO_CATEGORY.statePath(stateSlug),
      description: 'Compare APR ranges and research scores',
    },
    {
      label: 'Free mortgage calculators',
      href: '/calculators',
      description: 'Payment, affordability, and refinance tools',
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