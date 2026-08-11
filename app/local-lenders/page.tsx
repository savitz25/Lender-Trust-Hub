import type { Metadata } from 'next';
import { JsonLd } from '@/components/directory/JsonLd';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { NationalHubShell } from '@/components/directory/NationalHubShell';
import { HubCTAStrip } from '@/components/directory/HubCTAStrip';
import { LeadCaptureForm } from '@/components/directory/LeadCaptureForm';
import { SearchBar } from '@/components/SearchBar';
import { PersonalizedLenderBannerBoundary } from '@/components/PersonalizedLenderBannerBoundary';
import { LenderDirectoryLoader } from '@/components/directory/LenderDirectoryLoader';
import { SITE_URL, MORTGAGE_CATEGORY } from '@/lib/directory/categories';
import { lenders as rawCatalog, type LoanType } from '@/lib/mockData';
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
import type { LenderSortOption } from '@/lib/directory/filter-lenders';
import { NetworkHandoff } from '@/components/network/network-handoff';
import { NetworkBelongingLine } from '@/components/network/network-belonging-line';
import { catalogDistinctEntities } from '@/lib/verification';
import { getMortgagePublicCounts } from '@/lib/directory/public-counts';

export const revalidate = 86400;

/** National directory: one row per NMLS entity (no geo-variant inflation). */
const lenders = catalogDistinctEntities(rawCatalog);
const publicCounts = getMortgagePublicCounts();

const slugsWithLenders = getStateSlugsWithLenders();
const slugSet = new Set(slugsWithLenders);
const stateGrid = US_STATES.filter((s) => slugSet.has(s.slug)).map((s) => ({
  slug: s.slug,
  fullName: s.fullName,
  code: s.code,
  count: getStateMortgageStats(s.slug).total,
  region: s.region,
  countNoun: 'companies' as const,
}));

export const metadata: Metadata = {
  title: buildMortgageHubTitle(),
  description: buildMortgageHubDescription(publicCounts.distinctEntities),
  keywords: [
    'mortgage lenders by state',
    'NMLS mortgage research directory',
    'local mortgage lenders',
    'mortgage broker directory',
  ],
  openGraph: {
    title: buildMortgageHubTitle(),
    description: buildMortgageHubDescription(publicCounts.distinctEntities),
    url: `${SITE_URL}${MORTGAGE_CATEGORY.hubPath}`,
    locale: 'en_US',
  },
  alternates: {
    canonical: `${SITE_URL}${MORTGAGE_CATEGORY.hubPath}`,
  },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? '';
  return v ?? '';
}

export default async function LocalLendersHubPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const jsonLd = buildMortgageHubJsonLd(lenders.length, stateGrid.length);

  const initialSearch = firstParam(params.q) || firstParam(params.search) || firstParam(params.zip);
  const loanTypeRaw = firstParam(params.loanType) as LoanType | '';
  const sortRaw = (firstParam(params.sort) || 'trust') as LenderSortOption;
  const minRating = Number(firstParam(params.minRating)) || 0;

  return (
    <>
      <JsonLd data={jsonLd} />

      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Mortgage Lenders' }]} />
      </div>

      <section className="lth-hero-wash border-b border-zinc-200 py-14 text-[#0A2540]">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-3 inline-flex rounded-full border border-teal-400/40 bg-teal-500/10 px-4 py-1.5 text-sm">
            NMLS research directory • County-Level Data • No Paid Placements
          </p>
          <h1 className="text-3xl font-bold md:text-5xl">Research Mortgage Lenders</h1>
          <NetworkBelongingLine className="mt-3 text-zinc-600 [&_a]:text-white/90" />
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-600">
            Compare distinct NMLS entities in a 3-column directory — filter by loan type, trust
            score, and location. Hard NMLS ID verified requires a numeric ID. Zero paid placements.
          </p>
          <SearchBar className="mx-auto mt-8 max-w-md" />
        </div>
      </section>

      <PersonalizedLenderBannerBoundary
        variant="default"
        experimentKey="personalized-banner-v1"
      />

      {/* Primary directory grid — same progressive UX as MoveTrustHub /companies */}
      <section
        id="lender-directory"
        className="border-b border-zinc-200 bg-white py-10"
        aria-labelledby="lender-directory-heading"
      >
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <div className="text-xs font-semibold uppercase tracking-[2px] text-[#059669]">
              Comprehensive Directory
            </div>
            <h2
              id="lender-directory-heading"
              className="mt-1 text-3xl font-semibold tracking-tight text-[#0A2540] md:text-4xl"
            >
              Research mortgage companies
            </h2>
            <p className="mt-2 max-w-2xl text-zinc-600">
              {publicCounts.directorySummary} Ordered by locality honesty and NMLS signals —
              loan types. Independent directory — no lead fees for ranking.
            </p>
          </div>

          <LenderDirectoryLoader
            lenders={lenders}
            profileReturnPath="/local-lenders"
            initialSearch={initialSearch}
            initialSort={sortRaw}
            initialLoanType={loanTypeRaw}
            initialMinRating={minRating}
            showSearch
          />
        </div>
      </section>

      <div id="browse-by-state">
        <NationalHubShell
          categoryLabel={MORTGAGE_CATEGORY.label}
          statePathPrefix={MORTGAGE_CATEGORY.hubPath}
          title="Mortgage companies by state"
          description={`${publicCounts.directoryHeadline} across ${stateGrid.length} states with published research profiles. Pair with the FDIC bank directory for deposit insurance context.`}
          stateGrid={stateGrid}
          activeVertical="mortgage"
          availableSlugs={slugsWithLenders}
          countNoun="companies"
        />
      </div>

      <section className="border-t border-zinc-200 bg-white py-10">
        <div className="container mx-auto max-w-2xl px-4">
          <NetworkHandoff context="lender-directory" variant="card" />
        </div>
      </section>

      <section className="border-t border-zinc-200 bg-zinc-50 py-12">
        <div className="container mx-auto max-w-2xl px-4">
          <LeadCaptureForm stateName="your state" categoryId="mortgage" variant="hero-compact" />
        </div>
      </section>

      <HubCTAStrip />
    </>
  );
}
