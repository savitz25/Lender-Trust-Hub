import { SITE_URL } from '@/lib/directory/categories';
import { buildLenderOrganizationSchema } from '@/lib/seo/organization';
import { TENNESSEE_INTELLIGENCE_GATE } from './publication';
import { TENNESSEE_SNAPSHOT, type TennesseeIntelligenceSnapshot } from './snapshot';

export function buildTennesseeIntelligenceJsonLd(
  snapshot: TennesseeIntelligenceSnapshot = TENNESSEE_SNAPSHOT,
): Record<string, unknown> {
  const url = `${SITE_URL}${TENNESSEE_INTELLIGENCE_GATE.path}`;
  const s = snapshot;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildLenderOrganizationSchema(),
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: TENNESSEE_INTELLIGENCE_GATE.title,
        description: TENNESSEE_INTELLIGENCE_GATE.description,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${url}#dataset` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Tennessee Mortgage Licensing & Lending Intelligence', item: url },
        ],
      },
      {
        '@type': 'Dataset',
        '@id': `${url}#dataset`,
        name: 'Tennessee TDFI mortgage licensing, enforcement, and HMDA evidence snapshot',
        description: TENNESSEE_INTELLIGENCE_GATE.description,
        url,
        license: 'https://www.lendertrusthub.com/methodology',
        variableMeasured: [
          `${s.enforcement.ordersListed} TDFI enforcement order documents linked 2011-2023 (${s.enforcement.mortgageRelatedOrders} confirmed mortgage-related)`,
          `${s.hmda.applications} HMDA 2025 applications for properties in Tennessee`,
        ],
      },
    ],
  };
}

export function tnJsonLdHasForbiddenRatings(data: Record<string, unknown>): boolean {
  return /aggregateRating|reviewRating|"ratingValue"|"reviewCount"/i.test(JSON.stringify(data));
}
