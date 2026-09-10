import { SITE_URL } from '@/lib/directory/categories';
import { buildLenderOrganizationSchema } from '@/lib/seo/organization';
import { VIRGINIA_INTELLIGENCE_GATE } from './publication';
import { VIRGINIA_SNAPSHOT, type VirginiaIntelligenceSnapshot } from './snapshot';

export function buildVirginiaIntelligenceJsonLd(
  snapshot: VirginiaIntelligenceSnapshot = VIRGINIA_SNAPSHOT,
): Record<string, unknown> {
  const url = `${SITE_URL}${VIRGINIA_INTELLIGENCE_GATE.path}`;
  const s = snapshot;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildLenderOrganizationSchema(),
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: VIRGINIA_INTELLIGENCE_GATE.title,
        description: VIRGINIA_INTELLIGENCE_GATE.description,
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
            name: 'Virginia Mortgage Licensing & Lending Intelligence',
            item: url,
          },
        ],
      },
      {
        '@type': 'Dataset',
        '@id': `${url}#dataset`,
        name: 'Virginia SCC mortgage roster, HMDA, and homebuyer-program evidence snapshot',
        description: VIRGINIA_INTELLIGENCE_GATE.description,
        url,
        license: 'https://www.lendertrusthub.com/methodology',
        variableMeasured: [
          `${s.scc_roster.scc_reported.brokers_companies} SCC mortgage brokers as of 2025-12-31`,
          `${s.scc_roster.scc_reported.lenders_companies} SCC mortgage lenders as of 2025-12-31`,
          `${s.scc_roster.scc_reported.lender_brokers_companies} SCC lender-and-brokers as of 2025-12-31`,
          `${s.hmda.applications} HMDA 2025 applications for properties in Virginia`,
          `${s.cfpb.mortgage_complaint_rows} CFPB Virginia mortgage complaint rows`,
        ],
      },
    ],
  };
}

export function vaJsonLdHasForbiddenRatings(data: Record<string, unknown>): boolean {
  return /aggregateRating|reviewRating|"ratingValue"|"reviewCount"/i.test(JSON.stringify(data));
}
