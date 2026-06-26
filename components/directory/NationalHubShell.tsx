import Link from 'next/link';
import { DirectoryHubMap } from '@/components/directory/DirectoryHubMap';
import { CrossVerticalNav } from '@/components/directory/CrossVerticalNav';
import { ContentClusterHub } from '@/components/directory/ContentClusterHub';
import { HUB_KEYWORD_SECTIONS } from '@/lib/directory/content-clusters';
import { US_STATES } from '@/lib/fdic/states';

const REGIONS = [...new Set(US_STATES.map((s) => s.region))];

export interface StateGridItem {
  slug: string;
  fullName: string;
  code: string;
  count: number;
  region: string;
}

type HubVertical = 'fdic' | 'mortgage' | 'auto';

/**
 * National hub shell — map + region grid + cross-vertical nav + keyword sections.
 * Used by FDIC, mortgage, and auto hubs (and future verticals).
 */
export function NationalHubShell({
  categoryLabel,
  statePathPrefix,
  title,
  description,
  stateGrid,
  defaultStateCode = 'FL',
  activeVertical,
  availableSlugs,
}: {
  categoryLabel: string;
  statePathPrefix: string;
  title: string;
  description: string;
  stateGrid: StateGridItem[];
  defaultStateCode?: string;
  activeVertical: HubVertical;
  availableSlugs?: string[];
}) {
  const gridByRegion = REGIONS.map((region) => ({
    region,
    states: stateGrid.filter((s) => s.region === region),
  })).filter((g) => g.states.length > 0);

  const keywordSection = HUB_KEYWORD_SECTIONS[activeVertical];

  return (
    <>
      <section className="border-b border-zinc-200 bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold text-[#0A2540] md:text-3xl">{title}</h2>
            <p className="mt-4 text-zinc-600">{description}</p>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-lg font-semibold text-[#0A2540]">Interactive US Map</h3>
                <DirectoryHubMap
                  statePathPrefix={statePathPrefix}
                  defaultStateCode={defaultStateCode}
                  availableSlugs={availableSlugs}
                />
              </div>
            </div>
            <CrossVerticalNav activeVertical={activeVertical} />
          </div>
        </div>
      </section>

      {/* Keyword-optimized topical cluster section */}
      <section className="border-b border-zinc-200 bg-zinc-50 py-10">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="text-xl font-bold text-[#0A2540]">{keywordSection.title}</h2>
          {keywordSection.paragraphs.map((p) => (
            <p key={p.slice(0, 40)} className="mt-3 text-sm leading-relaxed text-zinc-600">
              {p}
            </p>
          ))}
          <nav aria-label="Related directories" className="mt-5 flex flex-wrap gap-3">
            {keywordSection.internalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch
                className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-[#0A2540] hover:border-[#00A3A1]"
              >
                {link.label} →
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <section className="border-b border-zinc-200 bg-zinc-50 py-12">
        <div className="container mx-auto px-4">
          <h2 className="mb-2 text-2xl font-bold text-[#0A2540]">
            Browse {categoryLabel} by State
          </h2>
          <p className="mb-8 max-w-3xl text-zinc-600">
            Click any state for a dedicated SEO-optimized page with filters, insights, and
            verification links.
          </p>
          {gridByRegion.map(({ region, states }) => (
            <div key={region} className="mb-8">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {region}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {states.map((s) => (
                  <Link
                    key={s.slug}
                    href={`${statePathPrefix}/${s.slug}`}
                    prefetch
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-3 transition hover:border-[#00A3A1] hover:shadow-sm"
                  >
                    <span className="font-semibold text-[#0A2540]">{s.fullName}</span>
                    <span className="mt-1 block text-xs text-zinc-500">
                      {s.count} {s.count === 1 ? 'listing' : 'listings'}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <ContentClusterHub hubVertical={activeVertical} />
    </>
  );
}