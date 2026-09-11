import { SITE_URL } from '@/lib/directory/categories';
import { buildLenderOrganizationSchema } from '@/lib/seo/organization';
import { ILLINOIS_INTELLIGENCE_GATE } from './publication';
import { ILLINOIS_SNAPSHOT, type IllinoisIntelligenceSnapshot } from './snapshot';

export function buildIllinoisIntelligenceJsonLd(
  snapshot: IllinoisIntelligenceSnapshot = ILLINOIS_SNAPSHOT,
): Record<string, unknown> {
  const url = `${SITE_URL}${ILLINOIS_INTELLIGENCE_GATE.path}`;
  const s = snapshot;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildLenderOrganizationSchema(),
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: ILLINOIS_INTELLIGENCE_GATE.title,
        description: ILLINOIS_INTELLIGENCE_GATE.description,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${url}#dataset` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Illinois Mortgage Lending Intelligence', item: url },
        ],
      },
      {
        '@type': 'Dataset',
        '@id': `${url}#dataset`,
        name: 'Illinois HMDA 2025 and FDIC depository overlay snapshot',
        description: ILLINOIS_INTELLIGENCE_GATE.description,
        url,
        license: 'https://www.lendertrusthub.com/methodology',
        variableMeasured: [
          `${s.hmda.applications} HMDA 2025 applications for properties in Illinois`,
          `${s.hmda.originations} HMDA 2025 originations for properties in Illinois`,
          `${s.fdic.institution_rows} FDIC Illinois depository institutions in the existing overlay`,
        ],
      },
    ],
  };
}

export function ilJsonLdHasForbiddenRatings(data: Record<string, unknown>): boolean {
  return /aggregateRating|reviewRating|"ratingValue"|"reviewCount"/i.test(JSON.stringify(data));
}
