import { SITE_URL } from '@/lib/directory/categories';
import { buildLenderOrganizationSchema } from '@/lib/seo/organization';
import { CALIFORNIA_INTELLIGENCE_GATE } from './publication';
import { CALIFORNIA_SNAPSHOT, type CaliforniaIntelligenceSnapshot } from './snapshot';

export function buildCaliforniaIntelligenceJsonLd(
  snapshot: CaliforniaIntelligenceSnapshot = CALIFORNIA_SNAPSHOT,
): Record<string, unknown> {
  const url = `${SITE_URL}${CALIFORNIA_INTELLIGENCE_GATE.path}`;
  const s = snapshot;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildLenderOrganizationSchema(),
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: CALIFORNIA_INTELLIGENCE_GATE.title,
        description: CALIFORNIA_INTELLIGENCE_GATE.description,
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
            name: 'California Mortgage & Lending Intelligence',
            item: url,
          },
        ],
      },
      {
        '@type': 'Dataset',
        '@id': `${url}#dataset`,
        name: 'California HMDA, CalHFA, and CRMLA evidence snapshot',
        description: CALIFORNIA_INTELLIGENCE_GATE.description,
        url,
        license: 'https://www.lendertrusthub.com/methodology',
        variableMeasured: [
          `${s.hmda.applications} HMDA 2025 applications for properties in California`,
          `${s.hmda.originations} HMDA 2025 originations`,
          `${s.calhfa_directory.directory_rows} CalHFA approved-lender directory rows`,
        ],
      },
    ],
  };
}

export function caJsonLdHasForbiddenRatings(data: Record<string, unknown>): boolean {
  return /aggregateRating|reviewRating|"ratingValue"|"reviewCount"/i.test(JSON.stringify(data));
}
