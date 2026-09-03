import { SITE_URL } from '@/lib/directory/categories';
import { buildLenderOrganizationSchema } from '@/lib/seo/organization';
import { NJ_COUNTY_INTELLIGENCE_GATES } from './publication';
import type { NjCountyIntelligenceSnapshot, NjCountySlug } from './types';

export function buildNjCountyIntelligenceJsonLd(
  snapshot: NjCountyIntelligenceSnapshot,
): Record<string, unknown> {
  const gate = NJ_COUNTY_INTELLIGENCE_GATES[snapshot.county_slug as NjCountySlug];
  const url = `${SITE_URL}${gate.path}`;
  const stateUrl = `${SITE_URL}/new-jersey`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildLenderOrganizationSchema(),
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: gate.title,
        description: gate.description,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${url}#dataset` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'New Jersey Mortgage & Lending Intelligence', item: stateUrl },
          { '@type': 'ListItem', position: 3, name: `${snapshot.county_name} County`, item: url },
        ],
      },
      {
        '@type': 'Dataset',
        '@id': `${url}#dataset`,
        name: `${snapshot.county_name} County mortgage and property-market research snapshot`,
        description: gate.description,
        url,
        license: 'https://www.lendertrusthub.com/methodology',
        variableMeasured: [
          `${snapshot.hmda.applications} HMDA 2025 applications for properties in ${snapshot.county_name} County`,
          `${snapshot.hmda.originations} HMDA 2025 originations`,
          `NJHMFA ${snapshot.njhmfa.dpa_group.replace('_', '-')} DPA geography`,
        ],
      },
    ],
  };
}

export function njCountyJsonLdHasForbiddenRatings(data: Record<string, unknown>): boolean {
  return /aggregateRating|reviewRating|"ratingValue"|"reviewCount"/i.test(JSON.stringify(data));
}
