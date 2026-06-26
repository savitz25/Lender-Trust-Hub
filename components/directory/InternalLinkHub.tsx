import Link from 'next/link';
import { FDIC_CATEGORY, MORTGAGE_CATEGORY, AUTO_CATEGORY } from '@/lib/directory/categories';
import { statePagePath } from '@/lib/fdic/seo';
import type { StateMeta } from '@/lib/fdic/types';

/**
 * Contextual internal links for SEO mesh — links to hub, sibling states, and verticals.
 */
export function InternalLinkHub({
  stateMeta,
  neighborSlugs = [],
}: {
  stateMeta: StateMeta;
  /** Same-region states for contextual linking */
  neighborSlugs?: string[];
}) {
  return (
    <aside
      aria-labelledby="internal-links-heading"
      className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6"
    >
      <h2 id="internal-links-heading" className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-400">
        Related Pages
      </h2>
      <ul className="space-y-2 text-sm">
        <li>
          <Link href={FDIC_CATEGORY.hubPath} className="font-medium text-[#00A3A1] hover:underline">
            All FDIC Banks by State →
          </Link>
        </li>
        <li>
          <Link
            href={MORTGAGE_CATEGORY.statePath(stateMeta.slug)}
            className="text-[#0A2540] hover:text-[#00A3A1]"
          >
            Mortgage lenders in {stateMeta.fullName}
          </Link>
        </li>
        <li>
          <Link
            href={AUTO_CATEGORY.statePath(stateMeta.slug)}
            className="text-[#0A2540] hover:text-[#00A3A1]"
          >
            Auto loan companies in {stateMeta.fullName}
          </Link>
        </li>
        <li>
          <Link href="/calculators" className="text-[#0A2540] hover:text-[#00A3A1]">
            Free mortgage calculators
          </Link>
        </li>
        {neighborSlugs.slice(0, 4).map((slug) => (
          <li key={slug}>
            <Link href={statePagePath(slug)} className="text-zinc-600 hover:text-[#00A3A1]">
              FDIC banks in {slug.replace(/-/g, ' ')}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}