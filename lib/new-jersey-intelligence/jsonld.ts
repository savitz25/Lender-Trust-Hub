import { SITE_URL } from '@/lib/directory/categories';
import { buildLenderOrganizationSchema } from '@/lib/seo/organization';
import { NEW_JERSEY_INTELLIGENCE_GATE } from './publication';
import { NEW_JERSEY_SNAPSHOT, type NewJerseyIntelligenceSnapshot } from './snapshot';

export function buildNewJerseyIntelligenceJsonLd(
  snapshot: NewJerseyIntelligenceSnapshot = NEW_JERSEY_SNAPSHOT,
): Record<string, unknown> {
  const url = `${SITE_URL}${NEW_JERSEY_INTELLIGENCE_GATE.path}`;
  const s = snapshot;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildLenderOrganizationSchema(),
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: NEW_JERSEY_INTELLIGENCE_GATE.title,
        description: NEW_JERSEY_INTELLIGENCE_GATE.description,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${url}#dataset` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'New Jersey Mortgage & Lending Intelligence', item: url },
        ],
      },
      {
        '@type': 'Dataset',
        '@id': `${url}#dataset`,
        name: 'New Jersey mortgage market, NJHMFA program, and NJDOBI evidence snapshot',
        description: NEW_JERSEY_INTELLIGENCE_GATE.description,
        url,
        license: 'https://www.lendertrusthub.com/methodology',
        variableMeasured: [
          `${s.hmda.applications} HMDA 2025 applications for properties in New Jersey`,
          `${s.hmda.originations} HMDA 2025 originations`,
          `${s.dobi.unique_orders} unique NJDOBI orders in the acquired corpus`,
        ],
      },
    ],
  };
}

export function njJsonLdHasForbiddenRatings(data: Record<string, unknown>): boolean {
  return /aggregateRating|reviewRating|"ratingValue"|"reviewCount"/i.test(JSON.stringify(data));
}
