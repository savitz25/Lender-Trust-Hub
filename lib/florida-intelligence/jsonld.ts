import { SITE_URL } from '@/lib/directory/categories';
import { buildLenderOrganizationSchema } from '@/lib/seo/organization';
import { FLORIDA_INTELLIGENCE_GATE } from './publication';
import { FLORIDA_SNAPSHOT } from './snapshot';

export function buildFloridaIntelligenceJsonLd(): Record<string, unknown> {
  const url = `${SITE_URL}${FLORIDA_INTELLIGENCE_GATE.path}`;
  const s = FLORIDA_SNAPSHOT;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildLenderOrganizationSchema(),
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: FLORIDA_INTELLIGENCE_GATE.title,
        description: FLORIDA_INTELLIGENCE_GATE.description,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${url}#dataset` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Florida Mortgage & Lending Research', item: url },
        ],
      },
      {
        '@type': 'Dataset',
        '@id': `${url}#dataset`,
        name: 'Florida mortgage licensing and Regulatory & Enforcement History research snapshot',
        description: FLORIDA_INTELLIGENCE_GATE.description,
        url,
        license: 'https://www.lendertrusthub.com/methodology',
        variableMeasured: [
          `${s.licensing.approved_credentials} Approved Chapter 494 company credentials`,
          `${s.licensing.unique_nmls} unique Approved company NMLS identities`,
          `${s.ofr.company} Florida Chapter 494 company final-agency-action observations`,
        ],
      },
    ],
  };
}

export function floridaJsonLdHasForbiddenRatings(data: Record<string, unknown>): boolean {
  return /aggregateRating|reviewRating|"ratingValue"|"reviewCount"/i.test(JSON.stringify(data));
}
