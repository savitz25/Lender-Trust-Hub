import type { Metadata } from 'next';
import { JsonLd } from '@/components/directory/JsonLd';
import { FDICBanksExplorerDynamic } from '@/components/fdic/FDICBanksExplorerDynamic';
import { NationalHubShell } from '@/components/directory/NationalHubShell';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { SITE_URL, FDIC_CATEGORY } from '@/lib/directory/categories';
import { stateData, getStateData, DEFAULT_STATE_CODE, DATA_UPDATED } from '@/lib/fdic/stateData';
import { US_STATES, STATE_BY_CODE } from '@/lib/fdic/states';
import { HubCTAStrip } from '@/components/directory/HubCTAStrip';
import { buildHubDescription, buildHubJsonLd, buildHubTitle } from '@/lib/fdic/seo';

const totalBanks = Object.values(stateData).reduce((sum, s) => sum + s.banks.length, 0);
const stateCount = US_STATES.filter((s) => s.hasData).length;
const defaultMeta = STATE_BY_CODE.get(DEFAULT_STATE_CODE)!;
const defaultData = getStateData(DEFAULT_STATE_CODE)!;

const stateGrid = US_STATES.filter((s) => s.hasData).map((s) => ({
  slug: s.slug,
  fullName: s.fullName,
  code: s.code,
  count: stateData[s.code]?.banks.length ?? 0,
  region: s.region,
}));

export const revalidate = 86400;

export const metadata: Metadata = {
  title: buildHubTitle(),
  description: buildHubDescription(totalBanks),
  keywords: [
    'FDIC insured banks',
    'FDIC banks by state',
    'list of FDIC banks 2026',
    'FDIC bank directory',
    'trusted FDIC banks',
    'FDIC banks near me',
  ],
  openGraph: {
    title: buildHubTitle(),
    description: buildHubDescription(totalBanks),
    siteName: 'Lender Trust Hub',
    type: 'website',
    url: `${SITE_URL}${FDIC_CATEGORY.hubPath}`,
    locale: 'en_US',
  },
  alternates: {
    canonical: `${SITE_URL}${FDIC_CATEGORY.hubPath}`,
  },
};

export default function FDICInsuredBanksPage() {
  const jsonLd = buildHubJsonLd(totalBanks, stateCount);

  return (
    <>
      <JsonLd data={jsonLd} />

      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'FDIC Insured Banks' },
          ]}
        />
      </div>

      <FDICBanksExplorerDynamic stateData={defaultData} stateMeta={defaultMeta} />

      <NationalHubShell
        categoryLabel={FDIC_CATEGORY.label}
        statePathPrefix={FDIC_CATEGORY.hubPath}
        title="The Definitive FDIC Bank Directory"
        description={`${totalBanks.toLocaleString()}+ verified institutions across ${stateCount} U.S. jurisdictions. Every listing links to official FDIC BankFind records. No paid placements — ever.`}
        stateGrid={stateGrid}
        defaultStateCode={DEFAULT_STATE_CODE}
        activeVertical="fdic"
      />

      <HubCTAStrip />

      <section className="border-t border-zinc-200 bg-[#0A2540] py-6 text-center text-xs text-zinc-400">
        Data last updated from FDIC {DATA_UPDATED}. Not financial advice.{' '}
        <a
          href="https://banks.data.fdic.gov/bankfind-suite/bankfind"
          className="text-[#00A3A1] underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Verify at FDIC BankFind
        </a>
        .
      </section>
    </>
  );
}