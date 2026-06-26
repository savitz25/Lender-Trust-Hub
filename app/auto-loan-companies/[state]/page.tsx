import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { JsonLd } from '@/components/directory/JsonLd';
import { CrossVerticalNav } from '@/components/directory/CrossVerticalNav';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { PersonalizedBanner } from '@/components/directory/PersonalizedBanner';
import { EditorialByline } from '@/components/directory/EditorialByline';
import { AutoProviderCard } from '@/components/auto/AutoProviderCard';
import { SearchBar } from '@/components/SearchBar';
import { STATE_BY_SLUG } from '@/lib/fdic/states';
import { FDIC_CATEGORY, MORTGAGE_CATEGORY } from '@/lib/directory/categories';
import {
  getProvidersByStateSlug,
  getStateSlugsWithAutoProviders,
  getStateAutoStats,
  AUTO_DATA_UPDATED,
} from '@/lib/auto/stateProviders';
import {
  buildAutoStateDescription,
  buildAutoStateJsonLd,
  buildAutoStateTitle,
  autoStateUrl,
} from '@/lib/auto/seo';

/**
 * AUTO LOAN STATE PAGE — cloned from mortgage template.
 * Clone again for credit-repair and MCA using VERTICAL_CLONE_GUIDE.
 */
export const revalidate = 86400;

export function generateStaticParams() {
  return getStateSlugsWithAutoProviders().map((state) => ({ state }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state: slug } = await params;
  const stateMeta = STATE_BY_SLUG.get(slug);
  if (!stateMeta) return { title: 'Auto Loan Companies | LenderTrustHub' };

  const stats = getStateAutoStats(slug);
  const title = buildAutoStateTitle(stateMeta.fullName, stats.total);
  const description = buildAutoStateDescription(
    stateMeta.fullName,
    stats.total,
    stats.verified,
    stats.avgAprLow
  );

  return {
    title,
    description,
    keywords: [
      `auto loan companies in ${stateMeta.fullName}`,
      `car loan rates ${stateMeta.fullName} 2026`,
      `best auto lenders ${stateMeta.fullName}`,
      'auto finance directory',
    ],
    openGraph: { title, description, url: autoStateUrl(slug), locale: 'en_US' },
    alternates: { canonical: autoStateUrl(slug) },
    robots: { index: true, follow: true },
  };
}

export default async function AutoLoanStatePage({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  const { state: slug } = await params;
  const stateMeta = STATE_BY_SLUG.get(slug);
  if (!stateMeta) notFound();

  const providers = getProvidersByStateSlug(slug);
  const stats = getStateAutoStats(slug);
  const jsonLd = buildAutoStateJsonLd(stateMeta, providers);

  if (providers.length === 0) notFound();

  return (
    <>
      <JsonLd data={jsonLd} />

      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Auto Loan Companies', href: '/auto-loan-companies' },
            { label: stateMeta.fullName },
          ]}
        />
      </div>

      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-teal-400/40 bg-teal-500/10 px-4 py-1.5 text-sm">
            Verified Lenders • Updated {AUTO_DATA_UPDATED} • No Paid Placements
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">
            Auto Loan Companies in {stateMeta.fullName} (2026)
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            {stats.total} lenders • {stats.verified} verified • APRs from {stats.avgAprLow}%+ • Avg
            trust score {stats.avgTrustScore}
          </p>
          <div className="mt-6">
            <SearchBar className="mx-auto max-w-md" />
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <PersonalizedBanner
              stateName={stateMeta.fullName}
              stateSlug={slug}
              vertical="auto"
              topEntityName={stats.topProvider?.name}
              variant="auto-state-v1"
            />

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Total Lenders', value: stats.total },
                { label: 'Verified', value: stats.verified },
                { label: 'Avg Trust Score', value: stats.avgTrustScore },
              ].map((card) => (
                <div key={card.label} className="rounded-2xl border bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase text-zinc-400">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold text-[#0A2540]">{card.value}</p>
                </div>
              ))}
            </div>

            <section aria-labelledby="auto-list-heading">
              <h2 id="auto-list-heading" className="mb-2 text-xl font-bold text-[#0A2540]">
                Top Auto Loan Companies in {stateMeta.fullName}
              </h2>
              <EditorialByline topic="Auto lending directory" />
              <div className="mt-4 space-y-4">
                {providers.map((provider, i) => (
                  <AutoProviderCard key={provider.id} provider={provider} rank={i + 1} />
                ))}
              </div>
            </section>

            <LeadCaptureForm
              stateName={stateMeta.fullName}
              categoryId="auto"
              variant="state-page-v2"
            />
          </div>

          <div className="space-y-6">
            <CrossVerticalNav
              stateSlug={slug}
              stateName={stateMeta.fullName}
              activeVertical="auto"
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
                    href={MORTGAGE_CATEGORY.statePath(slug)}
                    prefetch
                    className="text-[#00A3A1] hover:underline"
                  >
                    Mortgage Lenders in {stateMeta.fullName} →
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