import { SITE_URL } from '@/lib/directory/categories';
import { buildLenderOrganizationSchema } from '@/lib/seo/organization';
import { OREGON_INTELLIGENCE_GATE } from './publication';
import { OREGON_SNAPSHOT, type OregonIntelligenceSnapshot } from './snapshot';

export function buildOregonIntelligenceJsonLd(
  snapshot: OregonIntelligenceSnapshot = OREGON_SNAPSHOT,
): Record<string, unknown> {
  const url = `${SITE_URL}${OREGON_INTELLIGENCE_GATE.path}`;
  const s = snapshot;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildLenderOrganizationSchema(),
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: OREGON_INTELLIGENCE_GATE.title,
        description: OREGON_INTELLIGENCE_GATE.description,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${url}#dataset` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Oregon Mortgage Lending Intelligence', item: url },
        ],
      },
      {
        '@type': 'Dataset',
        '@id': `${url}#dataset`,
        name: 'Oregon HMDA 2025 and FDIC depository overlay snapshot',
        description: OREGON_INTELLIGENCE_GATE.description,
        url,
        license: 'https://www.lendertrusthub.com/methodology',
        variableMeasured: [
          `${s.hmda.applications} HMDA 2025 applications for properties in Oregon`,
          `${s.hmda.originations} HMDA 2025 originations for properties in Oregon`,
          `${s.fdic.institution_rows} FDIC Oregon depository institutions in the existing overlay`,
        ],
      },
    ],
  };
}

export function orJsonLdHasForbiddenRatings(data: Record<string, unknown>): boolean {
  return /aggregateRating|reviewRating|"ratingValue"|"reviewCount"/i.test(JSON.stringify(data));
}
