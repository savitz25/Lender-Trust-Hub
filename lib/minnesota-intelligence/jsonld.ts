import { SITE_URL } from '@/lib/directory/categories';
import { buildLenderOrganizationSchema } from '@/lib/seo/organization';
import { MINNESOTA_INTELLIGENCE_GATE } from './publication';
import { MINNESOTA_SNAPSHOT, type MinnesotaIntelligenceSnapshot } from './snapshot';

export function buildMinnesotaIntelligenceJsonLd(
  snapshot: MinnesotaIntelligenceSnapshot = MINNESOTA_SNAPSHOT,
): Record<string, unknown> {
  const url = `${SITE_URL}${MINNESOTA_INTELLIGENCE_GATE.path}`;
  const s = snapshot;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildLenderOrganizationSchema(),
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: MINNESOTA_INTELLIGENCE_GATE.title,
        description: MINNESOTA_INTELLIGENCE_GATE.description,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${url}#dataset` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Minnesota Mortgage Licensing & Lending Intelligence', item: url },
        ],
      },
      {
        '@type': 'Dataset',
        '@id': `${url}#dataset`,
        name: 'Minnesota Commerce mortgage licensing, enforcement, and HMDA evidence snapshot',
        description: MINNESOTA_INTELLIGENCE_GATE.description,
        url,
        license: 'https://www.lendertrusthub.com/methodology',
        variableMeasured: [
          `${s.enforcement.rows} Commerce mortgage enforcement actions signed 2022-2026 (CARDS)`,
          `${s.hmda.applications} HMDA 2025 applications for properties in Minnesota`,
        ],
      },
    ],
  };
}

export function mnJsonLdHasForbiddenRatings(data: Record<string, unknown>): boolean {
  return /aggregateRating|reviewRating|"ratingValue"|"reviewCount"/i.test(JSON.stringify(data));
}
