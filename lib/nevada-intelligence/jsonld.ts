import { SITE_URL } from '@/lib/directory/categories';
import { buildLenderOrganizationSchema } from '@/lib/seo/organization';
import { NEVADA_INTELLIGENCE_GATE } from './publication';
import { NEVADA_SNAPSHOT, type NevadaIntelligenceSnapshot } from './snapshot';

export function buildNevadaIntelligenceJsonLd(
  snapshot: NevadaIntelligenceSnapshot = NEVADA_SNAPSHOT,
): Record<string, unknown> {
  const url = `${SITE_URL}${NEVADA_INTELLIGENCE_GATE.path}`;
  const s = snapshot;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildLenderOrganizationSchema(),
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: NEVADA_INTELLIGENCE_GATE.title,
        description: NEVADA_INTELLIGENCE_GATE.description,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${url}#dataset` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Nevada Mortgage Licensing & Lending Intelligence', item: url },
        ],
      },
      {
        '@type': 'Dataset',
        '@id': `${url}#dataset`,
        name: 'Nevada MLD mortgage licensing, enforcement, and HMDA evidence snapshot',
        description: NEVADA_INTELLIGENCE_GATE.description,
        url,
        license: 'https://www.lendertrusthub.com/methodology',
        variableMeasured: [
          `${s.enforcement.indexRows} MLD enforcement index rows 2012-2026 (${s.enforcement.documentsLinked} order documents linked)`,
          `${s.hmda.applications} HMDA 2025 applications for properties in Nevada`,
        ],
      },
    ],
  };
}

export function nvJsonLdHasForbiddenRatings(data: Record<string, unknown>): boolean {
  return /aggregateRating|reviewRating|"ratingValue"|"reviewCount"/i.test(JSON.stringify(data));
}
