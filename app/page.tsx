import type { Metadata } from 'next';
import { JsonLd } from '@/components/directory/JsonLd';
import { LenderHomeIntelligence } from '@/components/home-intel/lender-home-intelligence';
import { getLenderHomeIntel } from '@/lib/home-intel/build';
import { SHARE_HUB } from '@/lib/seo/share-hub';

const isProd = process.env.VERCEL_ENV === 'production';

const TITLE = 'Understand the mortgage market before you choose a lender | Lender Trust Hub';
const DESCRIPTION =
  'Independent mortgage-market research: institutions, HMDA applications and originations, complaint observations, licensing and regulatory evidence. No Trust Score. No ranking. You decide.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  keywords: ['mortgage intelligence', 'lender research', 'HMDA', 'NMLS', 'public regulatory evidence'],
  alternates: { canonical: SHARE_HUB.origin },
  robots: { index: isProd, follow: isProd },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SHARE_HUB.origin,
    siteName: SHARE_HUB.brand,
  },
};

export default function HomePage() {
  const intel = getLenderHomeIntel();
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': `${SHARE_HUB.origin}/#webpage`,
          name: TITLE,
          url: SHARE_HUB.origin,
          description: DESCRIPTION,
          isPartOf: { '@id': `${SHARE_HUB.origin}/#website` },
          about: [
            { '@type': 'Thing', name: 'HMDA mortgage applications' },
            { '@type': 'Thing', name: 'NMLS institution identity' },
            { '@type': 'Thing', name: 'CFPB mortgage complaint observations' },
          ],
        }}
      />
      <LenderHomeIntelligence intel={intel} />
    </>
  );
}
