import { SITE_URL } from '@/lib/directory/categories';
import { buildLenderOrganizationSchema } from '@/lib/seo/organization';
import { PENNSYLVANIA_INTELLIGENCE_GATE } from './publication';
import { PENNSYLVANIA_SNAPSHOT, type PennsylvaniaIntelligenceSnapshot } from './snapshot';

export function buildPennsylvaniaIntelligenceJsonLd(
  snapshot: PennsylvaniaIntelligenceSnapshot = PENNSYLVANIA_SNAPSHOT,
): Record<string, unknown> {
  const url = `${SITE_URL}${PENNSYLVANIA_INTELLIGENCE_GATE.path}`;
  const s = snapshot;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildLenderOrganizationSchema(),
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: PENNSYLVANIA_INTELLIGENCE_GATE.title,
        description: PENNSYLVANIA_INTELLIGENCE_GATE.description,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${url}#dataset` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Pennsylvania Mortgage & Lending Intelligence', item: url },
        ],
      },
      {
        '@type': 'Dataset',
        '@id': `${url}#dataset`,
        name: 'Pennsylvania HMDA 2025, CFPB 2025 mortgage complaints, and FDIC overlay snapshot',
        description: PENNSYLVANIA_INTELLIGENCE_GATE.description,
        url,
        license: 'https://www.lendertrusthub.com/methodology',
        variableMeasured: [
          `${s.hmda.applications} HMDA 2025 applications for properties in Pennsylvania`,
          `${s.hmda.originations} HMDA 2025 originations for properties in Pennsylvania`,
          `${s.cfpb.PA_CFPB_2025_MORTGAGE_COMPLAINT_ROWS} CFPB 2025 Pennsylvania mortgage complaints`,
          `${s.fdic.institution_rows} FDIC Pennsylvania depository institutions in the existing overlay`,
        ],
      },
    ],
  };
}

export function paJsonLdHasForbiddenRatings(data: Record<string, unknown>): boolean {
  return /aggregateRating|reviewRating|"ratingValue"|"reviewCount"/i.test(JSON.stringify(data));
}
