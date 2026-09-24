import { SITE_URL } from '@/lib/directory/categories';
import { buildLenderOrganizationSchema } from '@/lib/seo/organization';
import { MASSACHUSETTS_INTELLIGENCE_GATE } from './publication';
import { MASSACHUSETTS_SNAPSHOT, type MassachusettsIntelligenceSnapshot } from './snapshot';

export function buildMassachusettsIntelligenceJsonLd(
  snapshot: MassachusettsIntelligenceSnapshot = MASSACHUSETTS_SNAPSHOT,
): Record<string, unknown> {
  const url = `${SITE_URL}${MASSACHUSETTS_INTELLIGENCE_GATE.path}`;
  const s = snapshot;
  const L = s.licenses;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildLenderOrganizationSchema(),
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: MASSACHUSETTS_INTELLIGENCE_GATE.title,
        description: MASSACHUSETTS_INTELLIGENCE_GATE.description,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${url}#dataset` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Massachusetts Mortgage Licensing & Lending Intelligence', item: url },
        ],
      },
      {
        '@type': 'Dataset',
        '@id': `${url}#dataset`,
        name: 'Massachusetts Division of Banks mortgage licensee, enforcement, and HMDA evidence snapshot',
        description: MASSACHUSETTS_INTELLIGENCE_GATE.description,
        url,
        license: 'https://www.lendertrusthub.com/methodology',
        temporalCoverage: `${L.source_as_of}`,
        variableMeasured: [
          `${L.lender.distinct_company_nmls_ids} companies on the DOB mortgage lender file as of ${L.source_as_of}`,
          `${L.broker.distinct_company_nmls_ids} companies on the DOB mortgage broker file as of ${L.source_as_of}`,
          `${L.mlo.distinct_person_nmls_ids} individual NMLS IDs on the DOB mortgage loan originator file as of ${L.source_as_of}`,
          `${s.enforcement.mortgage_related_events} mortgage-related DOB enforcement table rows, 2021-2026`,
          `${s.hmda.applications} HMDA 2025 applications for properties in Massachusetts`,
        ],
      },
    ],
  };
}

export function maJsonLdHasForbiddenRatings(data: Record<string, unknown>): boolean {
  return /aggregateRating|reviewRating|"ratingValue"|"reviewCount"/i.test(JSON.stringify(data));
}
