import Link from 'next/link';
import { DIRECTORY_CLUSTERS } from '@/lib/directory/content-clusters';

/**
 * Topical content clusters — targets featured snippets and builds authority.
 * Server-rendered on national hub pages for crawlability.
 */
export function ContentClusterHub({ stateSlug }: { stateSlug?: string }) {
  return (
    <section aria-labelledby="content-clusters" className="border-t border-zinc-200 bg-white py-12">
      <div className="container mx-auto px-4">
        <h2 id="content-clusters" className="mb-2 text-2xl font-bold text-[#0A2540]">
          Lending Resource Hub
        </h2>
        <p className="mb-8 max-w-2xl text-sm text-zinc-600">
          Topical guides and directories — optimized for the questions borrowers ask most.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DIRECTORY_CLUSTERS.map((cluster) => (
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
              {cluster.relatedCalculator && (
                <p className="mt-2 text-xs text-zinc-500">
                  Includes calculator tools →
                </p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}