import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { JsonLd } from '@/components/directory/JsonLd';
import { CrossVerticalNav } from '@/components/directory/CrossVerticalNav';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { PersonalizedBanner } from '@/components/directory/PersonalizedBanner';
import { LenderCard } from '@/components/LenderCard';
import { SearchBar } from '@/components/SearchBar';
import { STATE_BY_SLUG } from '@/lib/fdic/states';
import { FDIC_CATEGORY } from '@/lib/directory/categories';
import {
  getLendersByStateSlug,
  getStateMortgageStats,
  getStateSlugsWithLenders,
  MORTGAGE_DATA_UPDATED,
} from '@/lib/mortgage/stateLenders';
import {
  buildMortgageStateDescription,
  buildMortgageStateJsonLd,
  buildMortgageStateTitle,
  mortgageStateUrl,
} from '@/lib/mortgage/seo';

/**
 * MORTGAGE STATE PAGE TEMPLATE
 * ===========================
 * Clone this file for auto/credit/MCA verticals:
 *   1. Swap lib/mortgage/ → lib/{vertical}/
 *   2. Swap MORTGAGE_CATEGORY → AUTO_CATEGORY in imports
 *   3. Swap LenderCard → vertical-specific card component
 */
export const revalidate = 86400;

export function generateStaticParams() {
  return getStateSlugsWithLenders().map((state) => ({ state }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state: slug } = await params;
  const stateMeta = STATE_BY_SLUG.get(slug);
  if (!stateMeta) return { title: 'Mortgage Lenders | LenderTrustHub' };

  const lenders = getLendersByStateSlug(slug);
  const stats = getStateMortgageStats(slug);
  const title = buildMortgageStateTitle(stateMeta.fullName, stats.total);
  const description = buildMortgageStateDescription(
    stateMeta.fullName,
    stats.total,
    stats.verified
  );

  return {
    title,
    description,
    keywords: [
      `mortgage lenders in ${stateMeta.fullName}`,
      `mortgage brokers ${stateMeta.fullName} 2026`,
      `best mortgage lenders ${stateMeta.fullName}`,
      'NMLS verified mortgage',
    ],
    openGraph: { title, description, url: mortgageStateUrl(slug), locale: 'en_US' },
    alternates: { canonical: mortgageStateUrl(slug) },
    robots: { index: true, follow: true },
  };
}

export default async function MortgageStatePage({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  const { state: slug } = await params;
  const stateMeta = STATE_BY_SLUG.get(slug);
  if (!stateMeta) notFound();

  const stateLenders = getLendersByStateSlug(slug);
  const stats = getStateMortgageStats(slug);
  const jsonLd = buildMortgageStateJsonLd(stateMeta, stateLenders);

  if (stateLenders.length === 0) notFound();

  return (
    <>
      <JsonLd data={jsonLd} />

      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Mortgage Lenders', href: '/local-lenders' },
            { label: stateMeta.fullName },
          ]}
        />
      </div>

      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-teal-400/40 bg-teal-500/10 px-4 py-1.5 text-sm">
            NMLS Verified • Updated {MORTGAGE_DATA_UPDATED} • No Paid Placements
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">
            Mortgage Lenders in {stateMeta.fullName} (2026)
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            {stats.total} lenders & brokers • {stats.verified} NMLS verified • Avg trust score{' '}
            {stats.avgTrustScore}
          </p>
          <div className="mt-6">
            <SearchBar className="mx-auto max-w-md" />
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <PersonalizedBanner
              stateName={stateMeta.fullName}
              stateSlug={slug}
              vertical="mortgage"
              topEntityName={stats.topLender?.name}
              variant="mortgage-state-v1"
            />

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Total Lenders', value: stats.total },
                { label: 'NMLS Verified', value: stats.verified },
                { label: 'Avg Trust Score', value: stats.avgTrustScore },
              ].map((card) => (
                <div key={card.label} className="rounded-2xl border bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase text-zinc-400">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold text-[#0A2540]">{card.value}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {stateLenders.map((lender, i) => (
                <LenderCard
                  key={lender.id}
                  lender={lender}
                  rank={i + 1}
                  countyLabel={`${lender.county} County`}
                />
              ))}
            </div>

            {stats.topCounties.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-bold text-[#0A2540]">
                  Browse by County in {stateMeta.fullName}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {stats.topCounties.map((c) => (
                    <Link
                      key={c.countySlug}
                      href={`/local-lenders/${slug}/${c.countySlug}`}
                      prefetch
                      className="rounded-xl border border-zinc-200 bg-white p-4 hover:border-[#00A3A1]"
                    >
                      <span className="font-semibold text-[#0A2540]">{c.county} County</span>
                      <span className="mt-1 block text-xs text-zinc-500">
                        {c.count} lender{c.count !== 1 ? 's' : ''}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <LeadCaptureForm
              stateName={stateMeta.fullName}
              categoryId="mortgage"
              variant="mortgage-state-v1"
            />
          </div>

          <div className="space-y-6">
            <CrossVerticalNav
              stateSlug={slug}
              stateName={stateMeta.fullName}
              activeVertical="mortgage"
            />
            <aside className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-sm">
              <h2 className="font-semibold text-[#0A2540]">Also in {stateMeta.fullName}</h2>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link
                    href={FDIC_CATEGORY.statePath(slug)}
                    prefetch
                    className="text-[#00A3A1] hover:underline"
                  >
                    FDIC Insured Banks in {stateMeta.fullName} →
                  </Link>
                </li>
                <li>
                  <Link href="/calculators" className="text-[#00A3A1] hover:underline">
                    Free Mortgage Calculators →
                  </Link>
                </li>
              </ul>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}