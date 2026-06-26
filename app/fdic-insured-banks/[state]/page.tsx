import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { JsonLd } from '@/components/directory/JsonLd';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { InternalLinkHub } from '@/components/directory/InternalLinkHub';
import { CrossVerticalNav } from '@/components/directory/CrossVerticalNav';
import { PersonalizedBanner } from '@/components/directory/PersonalizedBanner';
import { computeExtendedStateStats } from '@/lib/fdic/utils';
import { FDICBanksExplorerDynamic } from '@/components/fdic/FDICBanksExplorerDynamic';
import { StateInsightsSection } from '@/components/fdic/StateInsightsSection';
import { STATE_BY_SLUG, US_STATES } from '@/lib/fdic/states';
import { getStateData, DATA_UPDATED } from '@/lib/fdic/stateData';
import {
  buildStateDescription,
  buildStateJsonLd,
  buildStateTitle,
  statePageUrl,
} from '@/lib/fdic/seo';

/** ISR: revalidate daily — keeps data fresh without full rebuilds */
export const revalidate = 86400;

export function generateStaticParams() {
  return US_STATES.filter((s) => s.hasData).map((s) => ({ state: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state: slug } = await params;
  const stateMeta = STATE_BY_SLUG.get(slug);
  if (!stateMeta?.hasData) return { title: 'FDIC Banks | LenderTrustHub' };

  const stateData = getStateData(stateMeta.code);
  if (!stateData) return { title: 'FDIC Banks | LenderTrustHub' };

  const hqCount = stateData.banks.filter((b) =>
    new RegExp(`, ${stateMeta.code}(?:\\s|$)`).test(b.headquarters_address)
  ).length;

  const title = buildStateTitle(stateMeta.fullName, stateData.banks.length);
  const description = buildStateDescription(
    stateMeta.fullName,
    stateData.banks.length,
    stateData.updated,
    hqCount
  );

  return {
    title,
    description,
    keywords: [
      `FDIC insured banks in ${stateMeta.fullName}`,
      `list of FDIC banks in ${stateMeta.fullName} 2026`,
      `${stateMeta.fullName} FDIC banks near me`,
      `best FDIC banks in ${stateMeta.fullName}`,
      'FDIC bank directory',
      'verified FDIC institutions',
    ],
    openGraph: {
      title,
      description,
      siteName: 'Lender Trust Hub',
      type: 'website',
      url: statePageUrl(slug),
      locale: 'en_US',
    },
    alternates: {
      canonical: statePageUrl(slug),
      // hreflang: expand when adding locales — languages: { 'en-US': statePageUrl(slug) }
    },
    robots: { index: true, follow: true },
  };
}

export default async function FDICStatePage({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  const { state: slug } = await params;
  const stateMeta = STATE_BY_SLUG.get(slug);
  if (!stateMeta?.hasData) notFound();

  const stateData = getStateData(stateMeta.code);
  if (!stateData) notFound();

  const jsonLd = buildStateJsonLd(stateMeta, stateData);
  const neighbors = US_STATES.filter(
    (s) => s.region === stateMeta.region && s.hasData && s.slug !== slug
  ).map((s) => s.slug);
  const stats = computeExtendedStateStats(stateData.banks, stateMeta.code);

  return (
    <>
      <JsonLd data={jsonLd} />

      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'FDIC Insured Banks', href: '/fdic-insured-banks' },
            { label: stateMeta.fullName },
          ]}
        />
      </div>

      <FDICBanksExplorerDynamic
        stateData={stateData}
        stateMeta={stateMeta}
        statePageMode
        stateSlug={slug}
      />

      <div className="container mx-auto px-4 pb-12">
        <PersonalizedBanner
          stateName={stateMeta.fullName}
          stateSlug={slug}
          vertical="fdic"
          topEntityName={stats.oldest?.name}
          variant="fdic-state-v2"
        />

        <StateInsightsSection banks={stateData.banks} stateMeta={stateMeta} />

        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <LeadCaptureForm stateName={stateMeta.fullName} variant="state-page-v2" />
          </div>
          <div className="space-y-6">
            <CrossVerticalNav
              stateSlug={slug}
              stateName={stateMeta.fullName}
              activeVertical="fdic"
            />
            <InternalLinkHub stateMeta={stateMeta} neighborSlugs={neighbors} />
          </div>
        </div>
      </div>

      {/* Crawler-visible institution index (first 30) — supplements JSON-LD */}
      <section className="sr-only" aria-label={`FDIC bank index for ${stateMeta.fullName}`}>
        <h2>FDIC Insured Banks in {stateMeta.fullName}</h2>
        <ul>
          {stateData.banks.slice(0, 30).map((bank) => (
            <li key={bank.fdic_cert}>
              {bank.name} — FDIC #{bank.fdic_cert} — {bank.headquarters_address}
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-zinc-200 bg-[#0A2540] py-6 text-center text-xs text-zinc-400">
        Data last updated from FDIC {DATA_UPDATED}. This directory is for informational purposes
        only. Not financial advice. Verify all data at{' '}
        <a
          href="https://banks.data.fdic.gov/bankfind-suite/bankfind"
          className="text-[#00A3A1] underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          FDIC BankFind
        </a>
        .
      </section>
    </>
  );
}