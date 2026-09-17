import { SITE_URL } from '@/lib/directory/categories';
import { buildLenderOrganizationSchema } from '@/lib/seo/organization';
import { NORTH_CAROLINA_INTELLIGENCE_GATE } from './publication';
import { NORTH_CAROLINA_SNAPSHOT, type NorthCarolinaIntelligenceSnapshot } from './snapshot';

export function buildNorthCarolinaIntelligenceJsonLd(
  snapshot: NorthCarolinaIntelligenceSnapshot = NORTH_CAROLINA_SNAPSHOT,
): Record<string, unknown> {
  const url = `${SITE_URL}${NORTH_CAROLINA_INTELLIGENCE_GATE.path}`;
  const s = snapshot;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildLenderOrganizationSchema(),
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: NORTH_CAROLINA_INTELLIGENCE_GATE.title,
        description: NORTH_CAROLINA_INTELLIGENCE_GATE.description,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${url}#dataset` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'North Carolina Mortgage & Lending Intelligence', item: url },
        ],
      },
      {
        '@type': 'Dataset',
        '@id': `${url}#dataset`,
        name: 'North Carolina HMDA 2025, NCCOB current license classes, CFPB 2025 mortgage complaints, and FDIC overlay snapshot',
        description: NORTH_CAROLINA_INTELLIGENCE_GATE.description,
        url,
        license: 'https://www.lendertrusthub.com/methodology',
        variableMeasured: [
          `${s.hmda.applications} HMDA 2025 applications for properties in North Carolina`,
          `${s.hmda.originations} HMDA 2025 originations for properties in North Carolina`,
          `${s.cfpb.NC_CFPB_2025_MORTGAGE_COMPLAINT_ROWS} CFPB 2025 North Carolina mortgage complaints`,
          `${s.current_roster.NC_MORTGAGE_LENDER_ROWS} current NCCOB Mortgage Lender licenses`,
          `${s.fdic.institution_rows} FDIC North Carolina depository institutions in the existing overlay`,
        ],
      },
    ],
  };
}

export function ncJsonLdHasForbiddenRatings(data: Record<string, unknown>): boolean {
  return /aggregateRating|reviewRating|"ratingValue"|"reviewCount"/i.test(JSON.stringify(data));
}
