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
import { FDIC_CATEGORY, AUTO_CATEGORY } from '@/lib/directory/categories';
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
            {slug === 'georgia' && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Link
                  href="/local-lenders/georgia/north-atlanta"
                  className="block rounded-2xl border border-[#14B8A6]/40 bg-teal-50 p-5 hover:bg-teal-100/80"
                >
                  <span className="font-semibold text-[#0A2540]">North Atlanta Hub →</span>
                  <span className="mt-1 block text-sm text-zinc-600">
                    Forsyth County — 10 verified lenders, Alpharetta, Johns Creek &amp; Cumming.
                  </span>
                </Link>
                <Link
                  href="/local-lenders/georgia/metro-outer-ring"
                  className="block rounded-2xl border border-[#F59E0B]/40 bg-amber-50 p-5 hover:bg-amber-100/80"
                >
                  <span className="font-semibold text-[#0A2540]">Metro Outer Ring Hub →</span>
                  <span className="mt-1 block text-sm text-zinc-600">
                    Henry County — 3 verified lenders, McDonough DPA &amp; first-time buyers.
                  </span>
                </Link>
                <Link
                  href="/local-lenders/georgia/coastal-savannah"
                  className="block rounded-2xl border border-[#3B82F6]/40 bg-blue-50 p-5 hover:bg-blue-100/80"
                >
                  <span className="font-semibold text-[#0A2540]">Coastal Savannah Hub →</span>
                  <span className="mt-1 block text-sm text-zinc-600">
                    Chatham County — 2 verified lenders, Pooler &amp; port relocations.
                  </span>
                </Link>
                <Link
                  href="/local-lenders/georgia/middle-georgia"
                  className="block rounded-2xl border border-[#8B5CF6]/40 bg-violet-50 p-5 hover:bg-violet-100/80"
                >
                  <span className="font-semibold text-[#0A2540]">Middle Georgia Hub →</span>
                  <span className="mt-1 block text-sm text-zinc-600">
                    Augusta &amp; Columbus — 5 verified lenders, Fort Eisenhower &amp; Fort Moore VA.
                  </span>
                </Link>
              </div>
            )}

            {slug === 'arizona' && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Link href="/local-lenders/arizona/west-valley-boomtowns"
                  className="block rounded-2xl border border-orange-500/40 bg-orange-50 p-5 hover:bg-orange-100/80">
                  <span className="font-semibold text-[#0A2540]">West Valley Boomtowns Hub →</span>
                  <span className="mt-1 block text-sm text-zinc-600">
                    Buckeye &amp; Goodyear — 12 verified lenders, 37%+ growth &amp; master-planned communities.
                  </span>
                </Link>
                <Link href="/local-lenders/arizona/southeast-valley-pinal-border"
                  className="block rounded-2xl border border-teal-500/40 bg-teal-50 p-5 hover:bg-teal-100/80">
                  <span className="font-semibold text-[#0A2540]">Southeast Valley &amp; Pinal Border Hub →</span>
                  <span className="mt-1 block text-sm text-zinc-600">
                    Queen Creek &amp; San Tan Valley — 12 verified lenders, 50%+ family growth.
                  </span>
                </Link>
              </div>
            )}

            {slug === 'tennessee' && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Link href="/local-lenders/tennessee/greater-nashville-metro"
                  className="block rounded-2xl border border-amber-500/40 bg-amber-50 p-5 hover:bg-amber-100/80">
                  <span className="font-semibold text-[#0A2540]">Greater Nashville Metro Hub →</span>
                  <span className="mt-1 block text-sm text-zinc-600">
                    Davidson, Williamson &amp; Rutherford — 12 verified lenders, corporate relocations.
                  </span>
                </Link>
                <Link href="/local-lenders/tennessee/knoxville-east-tennessee"
                  className="block rounded-2xl border border-emerald-500/40 bg-emerald-50 p-5 hover:bg-emerald-100/80">
                  <span className="font-semibold text-[#0A2540]">Knoxville &amp; East Tennessee Hub →</span>
                  <span className="mt-1 block text-sm text-zinc-600">
                    Knox, Blount &amp; Sevier — 12 verified lenders, Smokies &amp; vacation rentals.
                  </span>
                </Link>
              </div>
            )}

            {slug === 'california' && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Link href="/local-lenders/california/silicon-valley-spine"
                  className="block rounded-2xl border border-sky-500/40 bg-sky-50 p-5 hover:bg-sky-100/80">
                  <span className="font-semibold text-[#0A2540]">Silicon Valley Spine Hub →</span>
                  <span className="mt-1 block text-sm text-zinc-600">
                    San Jose &amp; Cupertino — 12 verified lenders, jumbo &amp; ultra-competitive tech corridor.
                  </span>
                </Link>
                <Link href="/local-lenders/california/inland-empire-affordability-magnets"
                  className="block rounded-2xl border border-amber-500/40 bg-amber-50 p-5 hover:bg-amber-100/80">
                  <span className="font-semibold text-[#0A2540]">Inland Empire Affordability Magnets Hub →</span>
                  <span className="mt-1 block text-sm text-zinc-600">
                    Riverside &amp; Moreno Valley — 12 verified lenders, SoCal affordability safety valve.
                  </span>
                </Link>
                <Link href="/local-lenders/california/central-valley-alternatives"
                  className="block rounded-2xl border border-emerald-500/40 bg-emerald-50 p-5 hover:bg-emerald-100/80">
                  <span className="font-semibold text-[#0A2540]">Central Valley Alternatives Hub →</span>
                  <span className="mt-1 block text-sm text-zinc-600">
                    Clovis &amp; Bakersfield — 12 verified lenders, remote workers &amp; cash-flow investing.
                  </span>
                </Link>
              </div>
            )}

            {slug === 'colorado' && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Link href="/local-lenders/colorado/denver-metro-outer-rings-north-suburbs"
                  className="block rounded-2xl border border-violet-500/40 bg-violet-50 p-5 hover:bg-violet-100/80">
                  <span className="font-semibold text-[#0A2540]">Denver Metro Outer Rings &amp; North Suburbs Hub →</span>
                  <span className="mt-1 block text-sm text-zinc-600">
                    Erie, Parker, Centennial, Lafayette &amp; Louisville — 12 verified lenders, master-planned growth.
                  </span>
                </Link>
              </div>
            )}

            {slug === 'north-carolina' && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Link href="/local-lenders/north-carolina/charlotte-metro"
                  className="block rounded-2xl border border-blue-500/40 bg-blue-50 p-5 hover:bg-blue-100/80">
                  <span className="font-semibold text-[#0A2540]">Charlotte Metro Hub →</span>
                  <span className="mt-1 block text-sm text-zinc-600">Mecklenburg — 5 verified lenders, corporate relocations.</span>
                </Link>
                <Link href="/local-lenders/north-carolina/research-triangle"
                  className="block rounded-2xl border border-teal-500/40 bg-teal-50 p-5 hover:bg-teal-100/80">
                  <span className="font-semibold text-[#0A2540]">Research Triangle Hub →</span>
                  <span className="mt-1 block text-sm text-zinc-600">Wake &amp; Durham — 5 verified lenders, tech &amp; RTP.</span>
                </Link>
                <Link href="/local-lenders/north-carolina/piedmont-triad"
                  className="block rounded-2xl border border-amber-500/40 bg-amber-50 p-5 hover:bg-amber-100/80">
                  <span className="font-semibold text-[#0A2540]">Piedmont Triad Hub →</span>
                  <span className="mt-1 block text-sm text-zinc-600">Guilford &amp; Forsyth — affordable equity markets.</span>
                </Link>
              </div>
            )}

            {slug === 'south-carolina' && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Link
                  href="/local-lenders/south-carolina/grand-strand"
                  className="block rounded-2xl border border-cyan-500/40 bg-cyan-50 p-5 hover:bg-cyan-100/80"
                >
                  <span className="font-semibold text-[#0A2540]">Grand Strand Hub →</span>
                  <span className="mt-1 block text-sm text-zinc-600">
                    Horry County — 5 verified lenders, Myrtle Beach &amp; retiree condos.
                  </span>
                </Link>
                <Link
                  href="/local-lenders/south-carolina/upstate"
                  className="block rounded-2xl border border-emerald-500/40 bg-emerald-50 p-5 hover:bg-emerald-100/80"
                >
                  <span className="font-semibold text-[#0A2540]">Upstate SC Hub →</span>
                  <span className="mt-1 block text-sm text-zinc-600">
                    Greenville &amp; Spartanburg — 5 verified lenders, manufacturing &amp; USDA.
                  </span>
                </Link>
                <Link
                  href="/local-lenders/south-carolina/lowcountry"
                  className="block rounded-2xl border border-indigo-500/40 bg-indigo-50 p-5 hover:bg-indigo-100/80"
                >
                  <span className="font-semibold text-[#0A2540]">Lowcountry Hub →</span>
                  <span className="mt-1 block text-sm text-zinc-600">
                    Charleston metro — 5 verified lenders, luxury condos &amp; corporate relocations.
                  </span>
                </Link>
              </div>
            )}

            {slug === 'florida' && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Link
                  href="/local-lenders/florida/south-florida"
                  className="block rounded-2xl border border-[#14B8A6]/40 bg-teal-50 p-5 hover:bg-teal-100/80"
                >
                  <span className="font-semibold text-[#0A2540]">South Florida Hub →</span>
                  <span className="mt-1 block text-sm text-zinc-600">
                    Miami-Dade, Broward, Palm Beach lenders.
                  </span>
                </Link>
                <Link
                  href="/local-lenders/florida/central-florida"
                  className="block rounded-2xl border border-[#3B82F6]/40 bg-blue-50 p-5 hover:bg-blue-100/80"
                >
                  <span className="font-semibold text-[#0A2540]">Central Florida Hub →</span>
                  <span className="mt-1 block text-sm text-zinc-600">
                    Orange County &amp; Orlando metro — 9 verified lenders.
                  </span>
                </Link>
                <Link
                  href="/local-lenders/florida/tampa-bay"
                  className="block rounded-2xl border border-[#F59E0B]/40 bg-amber-50 p-5 hover:bg-amber-100/80"
                >
                  <span className="font-semibold text-[#0A2540]">Tampa Bay Hub →</span>
                  <span className="mt-1 block text-sm text-zinc-600">
                    Hillsborough County — 10 verified lenders, MacDill VA.
                  </span>
                </Link>
                <Link
                  href="/local-lenders/florida/jacksonville"
                  className="block rounded-2xl border border-[#8B5CF6]/40 bg-violet-50 p-5 hover:bg-violet-100/80"
                >
                  <span className="font-semibold text-[#0A2540]">Jacksonville Hub →</span>
                  <span className="mt-1 block text-sm text-zinc-600">
                    Duval County — 10 verified lenders, NAS Jax &amp; Mayport VA.
                  </span>
                </Link>
                <Link
                  href="/local-lenders/florida/panhandle"
                  className="block rounded-2xl border border-[#10B981]/40 bg-emerald-50 p-5 hover:bg-emerald-100/80"
                >
                  <span className="font-semibold text-[#0A2540]">Florida Panhandle Hub →</span>
                  <span className="mt-1 block text-sm text-zinc-600">
                    Bay County — 10 verified lenders, Eglin &amp; PCB Emerald Coast.
                  </span>
                </Link>
              </div>
            )}

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
              variant="state-page-v2"
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
                  <Link
                    href={AUTO_CATEGORY.statePath(slug)}
                    prefetch
                    className="text-[#00A3A1] hover:underline"
                  >
                    Auto Loan Companies in {stateMeta.fullName} →
                  </Link>
                </li>
                <li>
                  <Link href="/calculators" className="text-[#00A3A1] hover:underline">
                    Free Mortgage Calculators →
                  </Link>
                </li>
              </ul>
            </aside>
            <LeadCaptureForm
              stateName={stateMeta.fullName}
              categoryId="mortgage"
              variant="sidebar-minimal"
            />
          </div>
        </div>
      </div>
    </>
  );
}