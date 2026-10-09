import Link from 'next/link';
import { getAllCounties } from '@/lib/lenders';
import { getSitemapCounties } from '@/lib/mortgage/county-quality-tiers';

export type StateCountyLink = {
  name: string;
  href: string;
};

let countyNames: Map<string, string> | null = null;
let sitemapCounties: ReturnType<typeof getSitemapCounties> | null = null;

function nameFor(stateSlug: string, countySlug: string): string {
  countyNames ??= new Map(
    getAllCounties().map((row) => [`${row.stateSlug}/${row.countySlug}`, row.county]),
  );
  return countyNames.get(`${stateSlug}/${countySlug}`)
    ?? countySlug.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

/** Sitemap counties for one state, sorted by display name. */
export function stateCountyLinks(stateSlug: string): StateCountyLink[] {
  sitemapCounties ??= getSitemapCounties();
  return sitemapCounties
    .filter((county) => county.stateSlug === stateSlug)
    .map((county) => ({
      name: nameFor(stateSlug, county.countySlug),
      href: `/local-lenders/${stateSlug}/${county.countySlug}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'en'));
}

/**
 * Server-rendered links from a state page to its sitemap counties.
 * Renders nothing when the state has no sitemap county.
 */
export function StateCountyLinks({
  stateSlug,
  stateName,
}: {
  stateSlug: string;
  stateName: string;
}) {
  const counties = stateCountyLinks(stateSlug);
  if (counties.length === 0) return null;
  return (
    <section className="mx-auto max-w-5xl px-5 py-10 text-slate-900" aria-label={`${stateName} counties`}>
      <h2 className="text-2xl font-semibold">{stateName} counties</h2>
      <ul className="mt-4 columns-1 gap-x-8 sm:columns-2 lg:columns-3">
        {counties.map((county) => (
          <li key={county.href} className="mb-2 break-inside-avoid">
            <Link href={county.href} className="text-teal-800 underline">
              {county.name}
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-6">
        <Link href={`/local-lenders/${stateSlug}`} className="font-medium text-teal-800 underline">
          {stateName} local lenders
        </Link>
      </p>
    </section>
  );
}
