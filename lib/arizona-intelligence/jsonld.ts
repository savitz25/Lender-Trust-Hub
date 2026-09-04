import { SITE_URL } from '@/lib/directory/categories';
import { buildLenderOrganizationSchema } from '@/lib/seo/organization';
import { ARIZONA_INTELLIGENCE_GATE } from './publication';
import { ARIZONA_SNAPSHOT, type ArizonaIntelligenceSnapshot } from './snapshot';

export function buildArizonaIntelligenceJsonLd(
  snapshot: ArizonaIntelligenceSnapshot = ARIZONA_SNAPSHOT,
): Record<string, unknown> {
  const url = `${SITE_URL}${ARIZONA_INTELLIGENCE_GATE.path}`;
  const s = snapshot;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildLenderOrganizationSchema(),
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: ARIZONA_INTELLIGENCE_GATE.title,
        description: ARIZONA_INTELLIGENCE_GATE.description,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${url}#dataset` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Arizona Mortgage & Lending Intelligence',
            item: url,
          },
        ],
      },
      {
        '@type': 'Dataset',
        '@id': `${url}#dataset`,
        name: 'Arizona HMDA, DIFI regulatory, and homebuyer-program evidence snapshot',
        description: ARIZONA_INTELLIGENCE_GATE.description,
        url,
        license: 'https://www.lendertrusthub.com/methodology',
        variableMeasured: [
          `${s.hmda.applications} HMDA 2025 applications for properties in Arizona`,
          `${s.hmda.originations} HMDA 2025 originations`,
          `${s.cfpb.mortgage_complaint_rows} CFPB Arizona mortgage complaint rows`,
        ],
      },
    ],
  };
}

export function azJsonLdHasForbiddenRatings(data: Record<string, unknown>): boolean {
  return /aggregateRating|reviewRating|"ratingValue"|"reviewCount"/i.test(JSON.stringify(data));
}
