import Link from 'next/link';
import { DIRECTORY_CLUSTERS } from '@/lib/directory/content-clusters';

/**
 * Topical content clusters — targets featured snippets and builds authority.
 * Server-rendered on national hub pages for crawlability.
 */
export function ContentClusterHub({
  stateSlug,
  hubVertical,
}: {
  stateSlug?: string;
  /** Highlights clusters most relevant to the current hub */
  hubVertical?: 'fdic' | 'mortgage' | 'auto';
}) {
  const sorted = hubVertical
    ? [...DIRECTORY_CLUSTERS].sort((a, b) => {
        const priority = [hubVertical, 'trust-transparency', 'mortgage-tools'];
        const aIdx = priority.indexOf(a.id === 'fdic-banks' ? 'fdic' : a.id === 'mortgage-lenders' ? 'mortgage' : a.id === 'auto-loans' ? 'auto' : a.id);
        const bIdx = priority.indexOf(b.id === 'fdic-banks' ? 'fdic' : b.id === 'mortgage-lenders' ? 'mortgage' : b.id === 'auto-loans' ? 'auto' : b.id);
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
          Lending Resource Hub
        </h2>
        <p className="mb-8 max-w-2xl text-sm text-zinc-600">
          Topical guides and directories — optimized for the questions borrowers ask most. Each
          cluster targets a featured-snippet query family with internal links across verticals.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((cluster) => (
            <Link
              key={cluster.id}
              href={stateSlug ? cluster.stateHref(stateSlug) : cluster.hubHref}
              prefetch
              className="group rounded-2xl border border-zinc-200 p-5 transition hover:border-[#00A3A1] hover:shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-[#00A3A1]">
                Targets: &ldquo;{cluster.targetQuery}&rdquo;
              </p>
              <h3 className="mt-2 font-semibold text-[#0A2540] group-hover:text-[#00A3A1]">
                {cluster.pillarTitle}
              </h3>
              {cluster.hubHeading && (
                <p className="mt-1 text-xs text-zinc-500">{cluster.hubHeading}</p>
              )}
              {cluster.keywordVariants && cluster.keywordVariants.length > 0 && (
                <p className="mt-2 text-[10px] text-zinc-400">
                  {cluster.keywordVariants.slice(0, 2).join(' · ')}
                </p>
              )}
              {cluster.relatedCalculator && (
                <p className="mt-2 text-xs text-zinc-500">Includes calculator tools →</p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}