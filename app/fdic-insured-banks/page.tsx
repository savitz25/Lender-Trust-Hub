import type { Metadata } from 'next';
import { JsonLd } from '@/components/directory/JsonLd';
import { FDICBanksExplorerDynamic } from '@/components/fdic/FDICBanksExplorerDynamic';
import { FDICHubContent } from '@/components/fdic/FDICHubContent';
import { Breadcrumbs } from '@/components/directory/Breadcrumbs';
import { SITE_URL, FDIC_CATEGORY } from '@/lib/directory/categories';
import { stateData, getStateData, DEFAULT_STATE_CODE } from '@/lib/fdic/stateData';
import { US_STATES, STATE_BY_CODE } from '@/lib/fdic/states';
import { buildHubDescription, buildHubJsonLd, buildHubTitle } from '@/lib/fdic/seo';

const totalBanks = Object.values(stateData).reduce((sum, s) => sum + s.banks.length, 0);
const stateCount = US_STATES.filter((s) => s.hasData).length;
const defaultMeta = STATE_BY_CODE.get(DEFAULT_STATE_CODE)!;
const defaultData = getStateData(DEFAULT_STATE_CODE)!;

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

      <FDICHubContent totalBanks={totalBanks} stateCount={stateCount} />
    </>
  );
}