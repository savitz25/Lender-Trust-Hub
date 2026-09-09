import { SITE_URL } from '@/lib/directory/categories';
import { buildLenderOrganizationSchema } from '@/lib/seo/organization';
import { COLORADO_INTELLIGENCE_GATE } from './publication';
import { COLORADO_SNAPSHOT, type ColoradoIntelligenceSnapshot } from './snapshot';

export function buildColoradoIntelligenceJsonLd(
  snapshot: ColoradoIntelligenceSnapshot = COLORADO_SNAPSHOT,
): Record<string, unknown> {
  const url = `${SITE_URL}${COLORADO_INTELLIGENCE_GATE.path}`;
  const s = snapshot;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildLenderOrganizationSchema(),
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: COLORADO_INTELLIGENCE_GATE.title,
        description: COLORADO_INTELLIGENCE_GATE.description,
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
            name: 'Colorado Mortgage & Lending Intelligence',
            item: url,
          },
        ],
      },
      {
        '@type': 'Dataset',
        '@id': `${url}#dataset`,
        name: 'Colorado HMDA, DRE MLO, and homebuyer-program evidence snapshot',
        description: COLORADO_INTELLIGENCE_GATE.description,
        url,
        license: 'https://www.lendertrusthub.com/methodology',
        variableMeasured: [
          `${s.hmda.applications} HMDA 2025 applications for properties in Colorado`,
          `${s.hmda.originations} HMDA 2025 originations`,
          `${s.mlo_roster.rows} Colorado DRE Mortgage Loan Originator license rows (person-grain)`,
          `${s.cfpb.mortgage_complaint_rows} CFPB Colorado mortgage complaint rows`,
        ],
      },
    ],
  };
}

export function coJsonLdHasForbiddenRatings(data: Record<string, unknown>): boolean {
  return /aggregateRating|reviewRating|"ratingValue"|"reviewCount"/i.test(JSON.stringify(data));
}
