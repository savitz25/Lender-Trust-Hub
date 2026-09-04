import { SITE_URL } from '@/lib/directory/categories';
import { buildLenderOrganizationSchema } from '@/lib/seo/organization';
import { TEXAS_INTELLIGENCE_GATE } from './publication';
import { TEXAS_SNAPSHOT, type TexasIntelligenceSnapshot } from './snapshot';

export function buildTexasIntelligenceJsonLd(
  snapshot: TexasIntelligenceSnapshot = TEXAS_SNAPSHOT,
): Record<string, unknown> {
  const url = `${SITE_URL}${TEXAS_INTELLIGENCE_GATE.path}`;
  const s = snapshot;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildLenderOrganizationSchema(),
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: TEXAS_INTELLIGENCE_GATE.title,
        description: TEXAS_INTELLIGENCE_GATE.description,
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
            name: 'Texas Mortgage & Lending Intelligence',
            item: url,
          },
        ],
      },
      {
        '@type': 'Dataset',
        '@id': `${url}#dataset`,
        name: 'Texas HMDA, SML order, and homebuyer-program evidence snapshot',
        description: TEXAS_INTELLIGENCE_GATE.description,
        url,
        license: 'https://www.lendertrusthub.com/methodology',
        variableMeasured: [
          `${s.hmda.applications} HMDA 2025 applications for properties in Texas`,
          `${s.hmda.originations} HMDA 2025 originations`,
          `${s.sml_orders.order_rows} SML enforcement orders`,
          `${s.sml_orders.exact_nmls_rows} SML orders with exact NMLS IDs`,
        ],
      },
    ],
  };
}

export function txJsonLdHasForbiddenRatings(data: Record<string, unknown>): boolean {
  return /aggregateRating|reviewRating|"ratingValue"|"reviewCount"/i.test(JSON.stringify(data));
}
