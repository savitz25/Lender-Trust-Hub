import { SITE_URL } from '@/lib/directory/categories';
import { buildLenderOrganizationSchema } from '@/lib/seo/organization';

export function buildNationalDiscoveryJsonLd(): Record<string, unknown> {
  const url = `${SITE_URL}/lender`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildLenderOrganizationSchema(),
      {
        '@type': ['WebPage', 'CollectionPage'],
        '@id': `${url}#webpage`,
        url,
        name: 'National lender research',
        description:
          'Independent research of canonical U.S. lending institutions using official identifiers, HMDA 2025 activity, CFPB complaint evidence, and regulatory records. Not a ranking.',
        isPartOf: { '@id': `${SITE_URL}/#website` },
      },
    ],
  };
}
