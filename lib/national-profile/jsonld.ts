import { buildLenderOrganizationSchema } from '@/lib/seo/organization';
import { SITE_URL } from '@/lib/directory/categories';
import { identifierLabel } from './format';
import { nationalProfileCanonical, nationalProfileTitle } from './seo';

type IdSlot = { identifier_type: string; identifier_value: string };

export function buildNationalProfileJsonLd(opts: {
  name: string;
  slug: string;
  identifiers: IdSlot[];
}): Record<string, unknown> {
  const url = nationalProfileCanonical(opts.slug);
  const identifiers = opts.identifiers
    .filter((i) => ['NMLS_INSTITUTION', 'LEI', 'FDIC_CERT', 'NCUA_CHARTER'].includes(i.identifier_type))
    .map((i) => ({
      '@type': 'PropertyValue',
      name: identifierLabel(i.identifier_type),
      value: i.identifier_value,
    }));

  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildLenderOrganizationSchema(),
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: nationalProfileTitle(opts.name),
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${url}#org` },
      },
      {
        '@type': ['Organization', 'FinancialService'],
        '@id': `${url}#org`,
        name: opts.name,
        url,
        identifier: identifiers,
      },
    ],
  };
}

export function jsonLdHasForbiddenRatings(data: Record<string, unknown>): boolean {
  const raw = JSON.stringify(data);
  return /aggregateRating|reviewRating|"ratingValue"|"reviewCount"/i.test(raw);
}
