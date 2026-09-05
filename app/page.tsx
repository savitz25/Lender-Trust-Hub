import type { Metadata } from 'next';
import { JsonLd } from '@/components/directory/JsonLd';
import { LenderHomeIntelligence, LenderHomeIntelligenceUnavailable } from '@/components/home-intel/lender-home-intelligence';
import { loadLenderHomeIntel } from '@/lib/home-intel/load';
import { SHARE_HUB } from '@/lib/seo/share-hub';

export const dynamic = 'force-dynamic';

const isProd = process.env.VERCEL_ENV === 'production';

const TITLE = 'Mortgage lender research, licensing & public evidence | LenderTrustHub';
const DESCRIPTION =
  'Research mortgage lenders through NMLS and state identity, HMDA activity, CFPB complaints, enforcement, FDIC context, and homebuyer programs. No Trust Score or ranking.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  keywords: ['mortgage lender research', 'NMLS lender lookup', 'HMDA mortgage data', 'CFPB mortgage complaints', 'mortgage licensing', 'mortgage enforcement', 'first-time homebuyer programs', 'FDIC bank research'],
  alternates: { canonical: SHARE_HUB.origin },
  robots: { index: isProd, follow: isProd },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SHARE_HUB.origin,
    siteName: SHARE_HUB.brand,
  },
};

export default async function HomePage() {
  const loaded = await loadLenderHomeIntel();
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
            { '@type': 'Thing', name: 'State mortgage licensing and enforcement' },
            { '@type': 'Thing', name: 'FDIC bank identity' },
            { '@type': 'Thing', name: 'State homebuyer programs' },
          ],
        }}
      />
      {loaded.status === 'ok' ? (
        <LenderHomeIntelligence intel={loaded.intel} />
      ) : (
        <LenderHomeIntelligenceUnavailable reason={loaded.reason} />
      )}
    </>
  );
}
