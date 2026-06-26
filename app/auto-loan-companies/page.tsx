import type { Metadata } from 'next';
import { JsonLd } from '@/components/directory/JsonLd';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { NationalHubShell } from '@/components/directory/NationalHubShell';
import { HubCTAStrip } from '@/components/directory/HubCTAStrip';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { SITE_URL, AUTO_CATEGORY } from '@/lib/directory/categories';
import { autoProviders } from '@/lib/auto/providers';
import { US_STATES } from '@/lib/fdic/states';
import {
  getStateSlugsWithAutoProviders,
  getStateAutoStats,
} from '@/lib/auto/stateProviders';
import {
  buildAutoHubDescription,
  buildAutoHubJsonLd,
  buildAutoHubTitle,
} from '@/lib/auto/seo';

export const revalidate = 86400;

const slugsWithProviders = getStateSlugsWithAutoProviders();
const slugSet = new Set(slugsWithProviders);
const stateGrid = US_STATES.filter((s) => slugSet.has(s.slug)).map((s) => ({
  slug: s.slug,
  fullName: s.fullName,
  code: s.code,
  count: getStateAutoStats(s.slug).total,
  region: s.region,
}));

export const metadata: Metadata = {
  title: buildAutoHubTitle(),
  description: buildAutoHubDescription(autoProviders.length),
  keywords: [
    'auto loan companies by state',
    'best auto loan lenders 2026',
    'car loan rates by state',
    'auto finance companies near me',
    'used car loan lenders',
  ],
  openGraph: {
    title: buildAutoHubTitle(),
    description: buildAutoHubDescription(autoProviders.length),
    url: `${SITE_URL}${AUTO_CATEGORY.hubPath}`,
    locale: 'en_US',
  },
  alternates: {
    canonical: `${SITE_URL}${AUTO_CATEGORY.hubPath}`,
  },
};

export default function AutoLoanCompaniesHubPage() {
  const jsonLd = buildAutoHubJsonLd(autoProviders.length, stateGrid.length);

  return (
    <>
      <JsonLd data={jsonLd} />

      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Auto Loan Companies' }]} />
      </div>

      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] py-14 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-teal-400/40 bg-teal-500/10 px-4 py-1.5 text-sm">
            Verified Lenders • APR Transparency • No Paid Placements
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Find Verified Auto Loan Companies</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Compare auto loan companies by state. Trust scores, APR ranges, and loan types for new,
            used, refinance, and bad credit financing.
          </p>
          <SearchBar className="mx-auto mt-8 max-w-md" />
        </div>
      </section>

      <NationalHubShell
        categoryLabel={AUTO_CATEGORY.label}
        statePathPrefix={AUTO_CATEGORY.hubPath}
        title="Auto Loan Companies by State"
        description={`${autoProviders.length}+ verified auto lenders across ${stateGrid.length} states. Select your state for APR comparisons, trust scores, and cross-links to FDIC banks and mortgage directories.`}
        stateGrid={stateGrid}
        activeVertical="auto"
        availableSlugs={slugsWithProviders}
      />

      <section className="border-t border-zinc-200 bg-zinc-50 py-12">
        <div className="container mx-auto max-w-2xl px-4">
          <LeadCaptureForm
            stateName="your state"
            categoryId="auto"
            variant="hero-compact"
          />
        </div>
      </section>

      <HubCTAStrip />
    </>
  );
}