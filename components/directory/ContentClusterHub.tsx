import Link from 'next/link';
import { DIRECTORY_CLUSTERS } from '@/lib/directory/content-clusters';

/**
 * Public resource grid on national hubs — plain consumer language only.
 */
export function ContentClusterHub({
  stateSlug,
  hubVertical,
}: {
  stateSlug?: string;
  hubVertical?: 'fdic' | 'mortgage' | 'auto';
}) {
  const sorted = hubVertical
    ? [...DIRECTORY_CLUSTERS].sort((a, b) => {
        const priority = [hubVertical, 'trust-transparency', 'mortgage-tools'];
        const aIdx = priority.indexOf(
          a.id === 'fdic-banks'
            ? 'fdic'
            : a.id === 'mortgage-lenders'
              ? 'mortgage'
              : a.id === 'auto-loans'
                ? 'auto'
                : a.id
        );
        const bIdx = priority.indexOf(
          b.id === 'fdic-banks'
            ? 'fdic'
            : b.id === 'mortgage-lenders'
              ? 'mortgage'
              : b.id === 'auto-loans'
                ? 'auto'
                : b.id
        );
        if (aIdx === -1 && bIdx === -1) return 0;
        if (aIdx === -1) return 1;
        if (bIdx === -1) return -1;
        return aIdx - bIdx;
      })
    : DIRECTORY_CLUSTERS;

  return (
    <section aria-labelledby="content-clusters" className="border-t border-zinc-200 bg-white py-12">
      <div className="container mx-auto px-4">
        <h2 id="content-clusters" className="mb-2 text-2xl font-bold text-[#0A2540]">
          Lending research resources
        </h2>
        <p className="mb-8 max-w-2xl text-sm text-zinc-600">
          Guides and directories for banks, mortgage companies, auto financing, and educational
          calculators. Independent research — no paid placements for ranking.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((cluster) => (
            <Link
              key={cluster.id}
              href={stateSlug ? cluster.stateHref(stateSlug) : cluster.hubHref}
              prefetch
              className="group rounded-2xl border border-zinc-200 p-5 transition hover:border-[#00A3A1] hover:shadow-sm"
            >
              <h3 className="font-semibold text-[#0A2540] group-hover:text-[#00A3A1]">
                {cluster.pillarTitle}
              </h3>
              <p className="mt-2 text-sm text-zinc-600">{cluster.description}</p>
              {cluster.relatedCalculator ? (
                <p className="mt-2 text-xs text-zinc-500">Includes calculator tools →</p>
              ) : null}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
