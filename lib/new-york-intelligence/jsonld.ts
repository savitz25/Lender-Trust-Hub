import { SITE_URL } from '@/lib/directory/categories';
import { buildLenderOrganizationSchema } from '@/lib/seo/organization';
import { NEW_YORK_INTELLIGENCE_GATE } from './publication';
import { NEW_YORK_SNAPSHOT, type NewYorkIntelligenceSnapshot } from './snapshot';

export function buildNewYorkIntelligenceJsonLd(
  snapshot: NewYorkIntelligenceSnapshot = NEW_YORK_SNAPSHOT,
): Record<string, unknown> {
  const url = `${SITE_URL}${NEW_YORK_INTELLIGENCE_GATE.path}`;
  const s = snapshot;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildLenderOrganizationSchema(),
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: NEW_YORK_INTELLIGENCE_GATE.title,
        description: NEW_YORK_INTELLIGENCE_GATE.description,
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
            name: 'New York Mortgage Licensing & Lending Intelligence',
            item: url,
          },
        ],
      },
      {
        '@type': 'Dataset',
        '@id': `${url}#dataset`,
        name: 'New York DFS mortgage supervision, enforcement, and HMDA evidence snapshot',
        description: NEW_YORK_INTELLIGENCE_GATE.description,
        url,
        license: 'https://www.lendertrusthub.com/methodology',
        variableMeasured: [
          `${s.dfs_2024_aggregates.licensed_mortgage_bankers} DFS licensed mortgage bankers as of end of 2024`,
          `${s.dfs_2024_aggregates.registered_mortgage_brokers} DFS registered mortgage brokers as of end of 2024`,
          `${s.hmda.applications} HMDA 2025 applications for properties in New York`,
          `${s.enforcement.observation_rows} NYDFS mortgage enforcement action observations`,
        ],
      },
    ],
  };
}

export function nyJsonLdHasForbiddenRatings(data: Record<string, unknown>): boolean {
  return /aggregateRating|reviewRating|"ratingValue"|"reviewCount"/i.test(JSON.stringify(data));
}
