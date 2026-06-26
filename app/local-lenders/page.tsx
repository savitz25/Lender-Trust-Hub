import type { Metadata } from 'next';
import { JsonLd } from '@/components/directory/JsonLd';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { NationalHubShell } from '@/components/directory/NationalHubShell';
import { SearchBar } from '@/components/SearchBar';
import { SITE_URL, MORTGAGE_CATEGORY } from '@/lib/directory/categories';
import { lenders } from '@/lib/mockData';
import { US_STATES } from '@/lib/fdic/states';
import {
  getStateSlugsWithLenders,
  getStateMortgageStats,
} from '@/lib/mortgage/stateLenders';
import {
  buildMortgageHubDescription,
  buildMortgageHubJsonLd,
  buildMortgageHubTitle,
} from '@/lib/mortgage/seo';

export const revalidate = 86400;

const slugsWithLenders = getStateSlugsWithLenders();
const slugSet = new Set(slugsWithLenders);
const stateGrid = US_STATES.filter((s) => slugSet.has(s.slug)).map((s) => ({
  slug: s.slug,
  fullName: s.fullName,
  code: s.code,
  count: getStateMortgageStats(s.slug).total,
  region: s.region,
}));

export const metadata: Metadata = {
  title: buildMortgageHubTitle(),
  description: buildMortgageHubDescription(lenders.length),
  keywords: [
    'mortgage lenders by state',
    'NMLS verified mortgage brokers',
    'local mortgage lenders',
    'best mortgage lenders 2026',
  ],
  openGraph: {
    title: buildMortgageHubTitle(),
    description: buildMortgageHubDescription(lenders.length),
    url: `${SITE_URL}${MORTGAGE_CATEGORY.hubPath}`,
    locale: 'en_US',
  },
  alternates: {
    canonical: `${SITE_URL}${MORTGAGE_CATEGORY.hubPath}`,
  },
};

export default function LocalLendersHubPage() {
  const jsonLd = buildMortgageHubJsonLd(lenders.length, stateGrid.length);

  return (
    <>
      <JsonLd data={jsonLd} />

      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Mortgage Lenders' }]} />
      </div>

      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-teal-400/40 bg-teal-500/10 px-4 py-1.5 text-sm">
            NMLS Verified • County-Level Data • No Paid Placements
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Find Verified Mortgage Lenders</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Hyper-local directory by state and county. Trust scores from NMLS, BBB, Google, and
            more.
          </p>
          <SearchBar className="mx-auto mt-8 max-w-md" />
        </div>
      </section>

      <NationalHubShell
        categoryLabel={MORTGAGE_CATEGORY.label}
        statePathPrefix={MORTGAGE_CATEGORY.hubPath}
        title="Mortgage Lenders by State"
        description={`${lenders.length}+ NMLS-verified lenders and brokers. Select your state for county-level listings, trust scores, and cross-links to FDIC bank data.`}
        stateGrid={stateGrid}
        activeVertical="mortgage"
        availableSlugs={slugsWithLenders}
      />
    </>
  );
}