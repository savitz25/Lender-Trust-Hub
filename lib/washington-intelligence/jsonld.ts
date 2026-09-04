import { SITE_URL } from '@/lib/directory/categories';
import { buildLenderOrganizationSchema } from '@/lib/seo/organization';
import { WASHINGTON_INTELLIGENCE_GATE } from './publication';
import { WASHINGTON_SNAPSHOT, type WashingtonIntelligenceSnapshot } from './snapshot';

export function buildWashingtonIntelligenceJsonLd(
  snapshot: WashingtonIntelligenceSnapshot = WASHINGTON_SNAPSHOT,
): Record<string, unknown> {
  const url = `${SITE_URL}${WASHINGTON_INTELLIGENCE_GATE.path}`;
  const s = snapshot;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildLenderOrganizationSchema(),
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: WASHINGTON_INTELLIGENCE_GATE.title,
        description: WASHINGTON_INTELLIGENCE_GATE.description,
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
            name: 'Washington Mortgage & Lending Intelligence',
            item: url,
          },
        ],
      },
      {
        '@type': 'Dataset',
        '@id': `${url}#dataset`,
        name: 'Washington HMDA, DFI enforcement, and homebuyer-program evidence snapshot',
        description: WASHINGTON_INTELLIGENCE_GATE.description,
        url,
        license: 'https://www.lendertrusthub.com/methodology',
        variableMeasured: [
          `${s.hmda.applications} HMDA 2025 applications for properties in Washington`,
          `${s.hmda.originations} HMDA 2025 originations`,
          `${s.dfi_enforcement.order_rows} DFI Consumer Services enforcement table rows`,
          `${s.dfi_enforcement.exact_nmls_rows} DFI orders with exact NMLS IDs`,
        ],
      },
    ],
  };
}

export function waJsonLdHasForbiddenRatings(data: Record<string, unknown>): boolean {
  return /aggregateRating|reviewRating|"ratingValue"|"reviewCount"/i.test(JSON.stringify(data));
}
