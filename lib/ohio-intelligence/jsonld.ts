import { SITE_URL } from '@/lib/directory/categories';
import { buildLenderOrganizationSchema } from '@/lib/seo/organization';
import { OHIO_INTELLIGENCE_GATE } from './publication';
import { OHIO_SNAPSHOT, type OhioIntelligenceSnapshot } from './snapshot';

export function buildOhioIntelligenceJsonLd(
  snapshot: OhioIntelligenceSnapshot = OHIO_SNAPSHOT,
): Record<string, unknown> {
  const url = `${SITE_URL}${OHIO_INTELLIGENCE_GATE.path}`;
  const s = snapshot;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildLenderOrganizationSchema(),
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: OHIO_INTELLIGENCE_GATE.title,
        description: OHIO_INTELLIGENCE_GATE.description,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${url}#dataset` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Ohio Mortgage & Lending Intelligence', item: url },
        ],
      },
      {
        '@type': 'Dataset',
        '@id': `${url}#dataset`,
        name: 'Ohio HMDA 2025, CFPB 2025 mortgage complaints, OHFA county participation, and FDIC overlay snapshot',
        description: OHIO_INTELLIGENCE_GATE.description,
        url,
        license: 'https://www.lendertrusthub.com/methodology',
        variableMeasured: [
          `${s.hmda.applications} HMDA 2025 applications for properties in Ohio`,
          `${s.hmda.originations} HMDA 2025 originations for properties in Ohio`,
          `${s.cfpb.OH_CFPB_2025_MORTGAGE_COMPLAINT_ROWS} CFPB 2025 Ohio mortgage complaints`,
          `${s.ohfa.OH_OHFA_DISTINCT_LENDER_NAMES} distinct OHFA Find A Lender names across 88 counties`,
          `${s.fdic.institution_rows} FDIC Ohio depository institutions in the existing overlay`,
        ],
      },
    ],
  };
}

export function ohJsonLdHasForbiddenRatings(data: Record<string, unknown>): boolean {
  return /aggregateRating|reviewRating|"ratingValue"|"reviewCount"/i.test(JSON.stringify(data));
}
