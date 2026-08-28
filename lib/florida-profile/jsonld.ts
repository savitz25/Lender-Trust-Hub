import { SITE_URL } from '@/lib/directory/categories';
import { buildLenderOrganizationSchema } from '@/lib/seo/organization';
import { nationalProfileCanonical, nationalProfileTitle } from '@/lib/national-profile/seo';
import type { FloridaPublicProfile } from './public-projection';

export function buildFloridaCompanyJsonLd(profile: FloridaPublicProfile): Record<string, unknown> {
  const url = nationalProfileCanonical(profile.slug);
  const addr = profile.credentials[0]?.prim_address;
  const org: Record<string, unknown> = {
    '@type': ['Organization', 'FinancialService'],
    '@id': `${url}#org`,
    name: profile.name,
    url,
    identifier: {
      '@type': 'PropertyValue',
      name: 'NMLS Institution ID',
      value: profile.nmls_id,
    },
  };
  if (addr && (addr.address1 || addr.city)) {
    org.address = {
      '@type': 'PostalAddress',
      streetAddress: [addr.address1, addr.address2].filter(Boolean).join(', ') || undefined,
      addressLocality: addr.city || undefined,
      addressRegion: addr.state || undefined,
      postalCode: addr.zip || undefined,
      addressCountry: 'US',
    };
  }
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildLenderOrganizationSchema(),
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: nationalProfileTitle(profile.name),
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${url}#org` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Florida research', item: `${SITE_URL}/florida` },
          { '@type': 'ListItem', position: 3, name: profile.name, item: url },
        ],
      },
      org,
    ],
  };
}

export function floridaCompanyJsonLdHasForbiddenRatings(data: Record<string, unknown>): boolean {
  return /aggregateRating|reviewRating|"ratingValue"|"reviewCount"|best lender|recommended/i.test(JSON.stringify(data));
}
